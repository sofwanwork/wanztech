import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addDays } from 'date-fns';
import {
    sendEmail,
    getSubscriptionReminderEmail,
    getGracePeriodStartedEmail,
    getAccountBlockedEmail,
} from '@/lib/email';

// Vercel Cron: runs daily at 8am UTC
// Add to vercel.json: { "crons": [{ "path": "/api/cron/subscription-check", "schedule": "0 8 * * *" }] }

const GRACE_PERIOD_DAYS = 3;
const REMINDER_DAYS_BEFORE = 3;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://klikform.vercel.app';

interface SubscriptionRow {
    id: string;
    user_id: string;
    tier: string;
    current_period_end: string;
    reminder_sent_at?: string | null;
    grace_email_sent?: string | null;
    blocked_email_sent?: string | null;
}

async function getUserEmail(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<{ email: string; name: string } | null> {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (!data?.user) return null;

    const email = data.user.email;
    if (!email) return null;

    const name = (data.user.user_metadata?.full_name as string) || email.split('@')[0];
    return { email, name };
}

export async function GET(request: NextRequest) {
    // Verify cron secret (prevent unauthorized access)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow local development without secret
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const supabase = await createClient();
    const now = new Date();
    const results = {
        reminders: 0,
        gracePeriodStarted: 0,
        accountsBlocked: 0,
        errors: [] as string[],
    };

    try {
        // 1. Send reminders for subscriptions expiring in 3 days
        const reminderDate = addDays(now, REMINDER_DAYS_BEFORE);
        const reminderDateStr = reminderDate.toISOString().split('T')[0];

        const { data: expiringSubscriptions } = await supabase
            .from('subscriptions')
            .select('id, user_id, tier, current_period_end, reminder_sent_at')
            .eq('tier', 'pro')
            .eq('status', 'active')
            .gte('current_period_end', `${reminderDateStr}T00:00:00`)
            .lte('current_period_end', `${reminderDateStr}T23:59:59`)
            .is('reminder_sent_at', null);

        for (const sub of (expiringSubscriptions as SubscriptionRow[]) || []) {
            const user = await getUserEmail(supabase, sub.user_id);
            if (!user) continue;

            const renewUrl = `${BASE_URL}/settings`;
            const emailContent = getSubscriptionReminderEmail(user.name, REMINDER_DAYS_BEFORE, renewUrl);
            const result = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            if (result.success) {
                await supabase
                    .from('subscriptions')
                    .update({ reminder_sent_at: now.toISOString() })
                    .eq('id', sub.id);
                results.reminders++;
            } else {
                results.errors.push(`Failed to send reminder to ${user.email}`);
            }
        }

        // 2. Check for newly expired subscriptions (grace period just started)
        const { data: newlyExpired } = await supabase
            .from('subscriptions')
            .select('id, user_id, tier, current_period_end, grace_email_sent')
            .eq('tier', 'pro')
            .eq('status', 'active')
            .lt('current_period_end', now.toISOString())
            .is('grace_email_sent', null);

        for (const sub of (newlyExpired as SubscriptionRow[]) || []) {
            const user = await getUserEmail(supabase, sub.user_id);
            if (!user) continue;

            const renewUrl = `${BASE_URL}/settings`;
            const emailContent = getGracePeriodStartedEmail(user.name, GRACE_PERIOD_DAYS, renewUrl);
            const result = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            if (result.success) {
                await supabase
                    .from('subscriptions')
                    .update({
                        grace_email_sent: now.toISOString(),
                        status: 'grace_period',
                    })
                    .eq('id', sub.id);
                results.gracePeriodStarted++;
            } else {
                results.errors.push(`Failed to send grace email to ${user.email}`);
            }
        }

        // 3. Block accounts where grace period has ended
        const graceEndDate = addDays(now, -GRACE_PERIOD_DAYS);

        const { data: toBlock } = await supabase
            .from('subscriptions')
            .select('id, user_id, tier, current_period_end, blocked_email_sent')
            .eq('tier', 'pro')
            .eq('status', 'grace_period')
            .lt('current_period_end', graceEndDate.toISOString())
            .is('blocked_email_sent', null);

        for (const sub of (toBlock as SubscriptionRow[]) || []) {
            const user = await getUserEmail(supabase, sub.user_id);
            if (!user) continue;

            const renewUrl = `${BASE_URL}/settings`;
            const emailContent = getAccountBlockedEmail(user.name, renewUrl);
            const result = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            // Update to expired status
            await supabase
                .from('subscriptions')
                .update({
                    status: 'expired',
                    blocked_email_sent: now.toISOString(),
                })
                .eq('id', sub.id);

            if (result.success) {
                results.accountsBlocked++;
            } else {
                results.errors.push(`Failed to send blocked email to ${user.email}`);
                results.accountsBlocked++; // Still count as blocked even if email failed
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription check completed',
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('Subscription check error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
