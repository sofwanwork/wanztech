'use server';

import { createClient } from '@/utils/supabase/server';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
}

export interface UserSubscription {
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'grace_period';
    currentPeriodEnd: string;
}

export async function getUserProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatarUrl: user.user_metadata?.avatar_url,
    } as UserProfile;
}

export async function getUserSubscription() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', user.id)
        .single();

    if (!subscription) return null;

    return {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
    } as UserSubscription;
}
