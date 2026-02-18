import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addDays, format } from 'date-fns';
import {
    sendEmail,
    getInactivityReminderEmail,
    getAccountDeletionWarningEmail,
} from '@/lib/email';

// Vercel Cron: runs daily at 9am UTC (5pm MYT)
// Schedule: "0 9 * * *"

const INACTIVITY_DAYS = 14;       // 2 weeks - send re-engagement email
const DELETION_SCHEDULE_DAYS = 30; // 1 month - schedule deletion (no forms)
const DELETION_WARNING_DAYS = 3;   // 3 days before deletion - send warning
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.klikform.com';

async function getUserInfo(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
): Promise<{ email: string; name: string } | null> {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (!data?.user?.email) return null;
    const name =
        (data.user.user_metadata?.full_name as string) ||
        data.user.email.split('@')[0];
    return { email: data.user.email, name };
}

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (
        process.env.NODE_ENV === 'production' &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const results = {
        inactivityEmailsSent: 0,
        deletionScheduled: 0,
        deletionWarningsSent: 0,
        accountsDeleted: 0,
        errors: [] as string[],
    };

    try {
        // ─────────────────────────────────────────────────────────────────────────
        // STEP 1: Send re-engagement email to users inactive for 14+ days
        // ─────────────────────────────────────────────────────────────────────────
        const inactivityThreshold = addDays(now, -INACTIVITY_DAYS).toISOString();

        // Get users inactive for 14+ days who haven't received inactivity email yet
        const { data: inactiveUsers } = await supabase.auth.admin.listUsers();

        for (const user of inactiveUsers?.users || []) {
            if (!user.email) continue;

            const lastSignIn = user.last_sign_in_at;
            const createdAt = user.created_at;

            // Skip if user signed in recently
            const lastActivity = lastSignIn || createdAt;
            if (!lastActivity || new Date(lastActivity) > new Date(inactivityThreshold)) {
                continue;
            }

            // Check if we already sent inactivity email
            const { data: log } = await supabase
                .from('user_inactivity_log')
                .select('id, inactivity_email_sent_at, scheduled_deletion_at')
                .eq('user_id', user.id)
                .single();

            // Skip if already sent inactivity email
            if (log?.inactivity_email_sent_at) continue;

            const name =
                (user.user_metadata?.full_name as string) || user.email.split('@')[0];
            const emailContent = getInactivityReminderEmail(name, `${BASE_URL}/login`);
            const result = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            if (result.success) {
                // Upsert log entry
                await supabase.from('user_inactivity_log').upsert(
                    {
                        user_id: user.id,
                        inactivity_email_sent_at: now.toISOString(),
                        updated_at: now.toISOString(),
                    },
                    { onConflict: 'user_id' }
                );
                results.inactivityEmailsSent++;
            } else {
                results.errors.push(`Inactivity email failed for ${user.email}`);
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // STEP 2: Schedule deletion for users inactive 30+ days with NO forms
        // ─────────────────────────────────────────────────────────────────────────
        const deletionThreshold = addDays(now, -DELETION_SCHEDULE_DAYS).toISOString();
        const scheduledDeletionDate = addDays(now, DELETION_WARNING_DAYS);

        for (const user of inactiveUsers?.users || []) {
            if (!user.email) continue;

            const lastActivity = user.last_sign_in_at || user.created_at;
            if (!lastActivity || new Date(lastActivity) > new Date(deletionThreshold)) {
                continue;
            }

            // Check if already scheduled for deletion
            const { data: log } = await supabase
                .from('user_inactivity_log')
                .select('id, scheduled_deletion_at')
                .eq('user_id', user.id)
                .single();

            if (log?.scheduled_deletion_at) continue; // Already scheduled

            // Check if user has any forms
            const { count: formCount } = await supabase
                .from('forms')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if ((formCount ?? 0) > 0) continue; // Has forms, skip deletion

            // Schedule deletion
            await supabase.from('user_inactivity_log').upsert(
                {
                    user_id: user.id,
                    scheduled_deletion_at: scheduledDeletionDate.toISOString(),
                    updated_at: now.toISOString(),
                },
                { onConflict: 'user_id' }
            );
            results.deletionScheduled++;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // STEP 3: Send deletion warning email (3 days before scheduled deletion)
        // ─────────────────────────────────────────────────────────────────────────
        const warningWindowStart = now.toISOString();
        const warningWindowEnd = addDays(now, 1).toISOString();

        const { data: pendingDeletion } = await supabase
            .from('user_inactivity_log')
            .select('user_id, scheduled_deletion_at')
            .gte('scheduled_deletion_at', warningWindowStart)
            .lte('scheduled_deletion_at', warningWindowEnd)
            .is('deletion_warning_sent_at', null);

        for (const log of pendingDeletion || []) {
            const userInfo = await getUserInfo(supabase, log.user_id);
            if (!userInfo) continue;

            const deletionDateStr = format(
                new Date(log.scheduled_deletion_at),
                'dd MMMM yyyy'
            );
            const emailContent = getAccountDeletionWarningEmail(
                userInfo.name,
                deletionDateStr,
                `${BASE_URL}/login`
            );
            const result = await sendEmail({
                to: userInfo.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });

            if (result.success) {
                await supabase
                    .from('user_inactivity_log')
                    .update({ deletion_warning_sent_at: now.toISOString(), updated_at: now.toISOString() })
                    .eq('user_id', log.user_id);
                results.deletionWarningsSent++;
            } else {
                results.errors.push(`Deletion warning failed for user ${log.user_id}`);
            }
        }

        // ─────────────────────────────────────────────────────────────────────────
        // STEP 4: Delete accounts past scheduled deletion date
        // ─────────────────────────────────────────────────────────────────────────
        const { data: toDelete } = await supabase
            .from('user_inactivity_log')
            .select('user_id')
            .lt('scheduled_deletion_at', now.toISOString())
            .not('deletion_warning_sent_at', 'is', null) // Only delete if warning was sent
            .is('deleted_at', null);

        for (const log of toDelete || []) {
            // Double-check: still no forms
            const { count: formCount } = await supabase
                .from('forms')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', log.user_id);

            if ((formCount ?? 0) > 0) {
                // User created forms since scheduling - cancel deletion
                await supabase
                    .from('user_inactivity_log')
                    .update({ scheduled_deletion_at: null, updated_at: now.toISOString() })
                    .eq('user_id', log.user_id);
                continue;
            }

            // Delete user from Supabase Auth (cascades to all related data via FK)
            const { error: deleteError } = await supabase.auth.admin.deleteUser(log.user_id);

            if (!deleteError) {
                // Mark as deleted in log (will be cascade deleted too, but good for audit)
                await supabase
                    .from('user_inactivity_log')
                    .update({ deleted_at: now.toISOString() })
                    .eq('user_id', log.user_id);
                results.accountsDeleted++;
            } else {
                results.errors.push(`Failed to delete user ${log.user_id}: ${deleteError.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Inactivity check completed',
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('Inactivity check error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
