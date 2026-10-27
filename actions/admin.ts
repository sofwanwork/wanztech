'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { verifyAdminSession, PRIMARY_ADMIN_EMAIL } from '@/lib/auth/admin';
import { SubscriptionTier, SubscriptionStatus } from '@/lib/types/subscription';
import { revalidatePath } from 'next/cache';

export interface AdminClientItem {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
  lastSignInAt?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  formsCount: number;
  totalSubmissions: number;
}

export interface AdminStats {
  totalClients: number;
  totalPro: number;
  totalEnterprise: number;
  totalFree: number;
  totalForms: number;
  totalSubmissions: number;
  totalRevenue: number;
}

/**
 * Fetch high-level statistics across all clients and activities.
 * Protected by verifyAdminSession().
 */
export async function getAdminStatsAction(): Promise<{
  success: boolean;
  data?: AdminStats;
  error?: string;
}> {
  try {
    await verifyAdminSession();
    const admin = createAdminClient();

    // 1. Fetch users from Supabase Auth
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;
    const users = usersData?.users || [];

    // 2. Fetch subscriptions
    const { data: subscriptions } = await admin.from('subscriptions').select('tier, status');

    // 3. Fetch forms total count
    const { count: formsCount } = await admin
      .from('forms')
      .select('id', { count: 'exact', head: true });

    // 4. Fetch usage for total submissions
    const { data: usageData } = await admin.from('usage').select('total_submissions');
    const totalSubmissions =
      usageData?.reduce((acc, curr) => acc + (Number(curr.total_submissions) || 0), 0) || 0;

    // 5. Fetch transactions for revenue
    const { data: transactions } = await admin
      .from('transactions')
      .select('amount, status')
      .eq('status', 'completed');
    const totalRevenue =
      transactions?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    let totalPro = 0;
    let totalEnterprise = 0;
    let totalFree = 0;

    subscriptions?.forEach((sub) => {
      const tier = sub.tier as SubscriptionTier;
      if (tier === 'pro') totalPro++;
      else if (tier === 'enterprise') totalEnterprise++;
      else totalFree++;
    });

    // Any user without subscription row is considered 'free'
    const trackedCount = (subscriptions?.length || 0);
    if (users.length > trackedCount) {
      totalFree += (users.length - trackedCount);
    }

    return {
      success: true,
      data: {
        totalClients: users.length,
        totalPro,
        totalEnterprise,
        totalFree,
        totalForms: formsCount || 0,
        totalSubmissions,
        totalRevenue,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan statistik';
    return { success: false, error: message };
  }
}

/**
 * Fetch all clients with their subscription details, usage stats, and profiles.
 * Supports filtering by tier, status, and query search.
 * Protected by verifyAdminSession().
 */
export async function getAdminClientsAction(): Promise<{
  success: boolean;
  data?: AdminClientItem[];
  error?: string;
}> {
  try {
    await verifyAdminSession();
    const admin = createAdminClient();

    // 1. Fetch auth users
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;
    const users = usersData?.users || [];

    // 2. Fetch all profiles, subscriptions, forms, and usage in parallel
    const [
      { data: profiles },
      { data: subscriptions },
      { data: forms },
      { data: usage },
    ] = await Promise.all([
      admin.from('profiles').select('*'),
      admin.from('subscriptions').select('*'),
      admin.from('forms').select('id, user_id'),
      admin.from('usage').select('user_id, total_submissions'),
    ]);

    // Build lookup maps
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const subMap = new Map((subscriptions || []).map((s) => [s.user_id, s]));

    const formsCountMap = new Map<string, number>();
    forms?.forEach((f) => {
      if (f.user_id) {
        formsCountMap.set(f.user_id, (formsCountMap.get(f.user_id) || 0) + 1);
      }
    });

    const submissionsCountMap = new Map<string, number>();
    usage?.forEach((u) => {
      if (u.user_id) {
        submissionsCountMap.set(
          u.user_id,
          (submissionsCountMap.get(u.user_id) || 0) + (Number(u.total_submissions) || 0)
        );
      }
    });

    // Merge into client records
    const clients: AdminClientItem[] = users.map((u) => {
      const profile = profileMap.get(u.id);
      const sub = subMap.get(u.id);

      const fullName =
        profile?.full_name ||
        (u.user_metadata?.full_name as string) ||
        u.email?.split('@')[0] ||
        'Client';

      const username =
        profile?.username ||
        (u.user_metadata?.username as string) ||
        u.email?.split('@')[0] ||
        'client';

      const tier: SubscriptionTier = (sub?.tier as SubscriptionTier) || 'free';
      const status: SubscriptionStatus = (sub?.status as SubscriptionStatus) || 'active';

      return {
        id: u.id,
        email: u.email || '',
        fullName,
        username,
        avatarUrl: profile?.avatar_url || (u.user_metadata?.avatar_url as string | undefined),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        tier,
        status,
        currentPeriodStart: sub?.current_period_start,
        currentPeriodEnd: sub?.current_period_end,
        formsCount: formsCountMap.get(u.id) || 0,
        totalSubmissions: submissionsCountMap.get(u.id) || 0,
      };
    });

    // Sort by registration date descending (latest users first)
    clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: clients,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan senarai klien';
    return { success: false, error: message };
  }
}

/**
 * Manually update a client's subscription tier, status, and expiry date.
 * Protected by verifyAdminSession().
 */
export async function updateClientSubscriptionAction(params: {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await verifyAdminSession();

    if (!params.userId) {
      return { success: false, error: 'ID Pengguna diperlukan' };
    }

    const admin = createAdminClient();

    // Upsert subscription record
    const { error } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: params.userId,
          tier: params.tier,
          status: params.status,
          current_period_end: params.currentPeriodEnd || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    revalidatePath('/admin');
    revalidatePath('/settings');
    revalidatePath('/forms');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengemas kini langganan klien';
    return { success: false, error: message };
  }
}

/**
 * Permanently delete a client from Supabase Auth and all associated records.
 * Protected by verifyAdminSession().
 * Strictly prevents deletion of Super Admin accounts.
 */
export async function deleteClientAction(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminUser = await verifyAdminSession();

    if (!userId) {
      return { success: false, error: 'ID Pengguna diperlukan' };
    }

    // Super Admin self-deletion prevention
    if (userId === adminUser.id) {
      return { success: false, error: 'Anda tidak boleh memadam akaun Super Admin anda sendiri!' };
    }

    const admin = createAdminClient();

    // Check target user to guarantee we never delete PRIMARY_ADMIN_EMAIL
    const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !targetData?.user) {
      return { success: false, error: 'Pengguna tidak ditemui' };
    }

    const targetEmail = targetData.user.email?.toLowerCase().trim();
    if (targetEmail === PRIMARY_ADMIN_EMAIL.toLowerCase().trim()) {
      return { success: false, error: 'Tidak dibenarkan memadam akaun Super Admin!' };
    }

    // Delete related rows that might not have ON DELETE CASCADE
    await Promise.allSettled([
      admin.from('forms').delete().eq('user_id', userId),
      admin.from('profiles').delete().eq('id', userId),
      admin.from('subscriptions').delete().eq('user_id', userId),
      admin.from('usage').delete().eq('user_id', userId),
      admin.from('settings').delete().eq('user_id', userId),
      admin.from('qr_codes').delete().eq('user_id', userId),
      admin.from('short_links').delete().eq('user_id', userId),
      admin.from('certificate_templates').delete().eq('user_id', userId),
      admin.from('bio_links').delete().eq('user_id', userId),
      admin.from('pamphlets').delete().eq('user_id', userId),
    ]);

    // Finally delete from Auth users
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    revalidatePath('/admin');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memadam klien';
    return { success: false, error: message };
  }
}

