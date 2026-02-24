import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';
import { getSubscription } from '@/lib/storage/subscription';

export interface ShortLink {
    id: string;
    user_id: string;
    slug: string;
    original_url: string;
    clicks: number;
    created_at: string;
}

// Helper to get user ID
async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized');
    return { supabase, user };
}

export async function getShortLinks(): Promise<ShortLink[]> {
    const { supabase, user } = await getUser();

    const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching short links:', error);
        return [];
    }

    return data as ShortLink[];
}

export async function createShortLink(slug: string, originalUrl: string): Promise<ShortLink> {
    const { supabase, user } = await getUser();

    // Basic validation
    if (!slug || !originalUrl) throw new Error('Missing fields');

    // Validate slug format — only allow safe alphanumeric slugs
    const SLUG_REGEX = /^[a-zA-Z0-9-_]{3,50}$/;
    if (!SLUG_REGEX.test(slug)) {
        throw new Error('Slug mesti 3-50 aksara. Hanya huruf, nombor, "-" dan "_" dibenarkan.');
    }

    // Validate URL — use URL constructor to ensure only http/https are accepted
    let url: string;
    try {
        let rawUrl = originalUrl.trim();
        // Prepend https if missing a scheme
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
            rawUrl = 'https://' + rawUrl;
        }
        const parsed = new URL(rawUrl);
        // Security: Only allow http and https to prevent javascript:, data:, etc.
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('URL mesti bermula dengan http:// atau https://');
        }
        url = parsed.toString();
    } catch (e) {
        if (e instanceof Error && e.message.includes('mesti')) throw e;
        throw new Error('URL tidak sah. Sila masukkan URL yang betul.');
    }

    // Check limits
    // Check limits and subscription status
    const { isSubscriptionBlocked } = await import('@/lib/storage/subscription');
    const blockStatus = await isSubscriptionBlocked();

    if (blockStatus.blocked) {
        throw new Error(
            blockStatus.reason === 'grace_period'
                ? 'Subscription grace period. Please renew to create links.'
                : 'Subscription expired. Please renew.'
        );
    }

    const subscription = await getSubscription();
    const limits = TIER_LIMITS[subscription.tier];

    if (limits.maxShortLinks !== -1) {
        const { count } = await supabase
            .from('short_links')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if ((count || 0) >= limits.maxShortLinks) {
            throw new Error(`Free tier is limited to ${limits.maxShortLinks} short links. Please upgrade to Pro.`);
        }
    }

    const { data, error } = await supabase
        .from('short_links')
        .insert({
            user_id: user.id,
            slug,
            original_url: url,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('Slug already exists');
        throw error;
    }

    return data as ShortLink;
}

export async function deleteShortLink(id: string): Promise<void> {
    const { supabase, user } = await getUser();
    const { error } = await supabase
        .from('short_links')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw error;
}

// Public access (no auth check needed mostly, but we use createClient anyway)
export async function getShortLinkBySlug(slug: string): Promise<ShortLink | undefined> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) return undefined;
    return data as ShortLink;
}

export async function incrementShortLinkClicks(id: string): Promise<void> {
    // Use adminClient to bypass RLS — public visitors don't have auth,
    // so the regular anon client cannot UPDATE the row. Same pattern as incrementSubmissionCount().
    const supabase = createAdminClient();

    const { data: existing } = await supabase
        .from('short_links')
        .select('clicks')
        .eq('id', id)
        .single();

    if (!existing) return;

    await supabase
        .from('short_links')
        .update({ clicks: (existing.clicks || 0) + 1 })
        .eq('id', id);
}

