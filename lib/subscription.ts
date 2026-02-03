import { createClient } from '@/utils/supabase/server';
import { Subscription, Usage, TIER_LIMITS, SubscriptionTier } from './types';

// Helper to get user
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { supabase, user };
}

// Get current month as YYYY-MM-01
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Get user's subscription (auto-create 'free' if not exists)
export async function getSubscription(): Promise<Subscription> {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no subscription exists, create one (free tier)
  if (error || !data) {
    const { data: newSub, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'free',
        status: 'active',
      })
      .select()
      .single();

    if (insertError || !newSub) {
      // Return default free subscription
      return {
        id: '',
        userId: user.id,
        tier: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    return {
      id: newSub.id,
      userId: newSub.user_id,
      tier: newSub.tier as SubscriptionTier,
      status: newSub.status,
      currentPeriodStart: newSub.current_period_start,
      currentPeriodEnd: newSub.current_period_end,
    };
  }

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier as SubscriptionTier,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
  };
}

// Get current month's usage (auto-create if not exists)
export async function getUsage(): Promise<Usage> {
  const { supabase, user } = await getUser();
  const month = getCurrentMonth();

  const { data, error } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .single();

  // If no usage record exists, create one
  if (error || !data) {
    const { data: newUsage, error: insertError } = await supabase
      .from('usage')
      .insert({
        user_id: user.id,
        month: month,
        forms_created: 0,
        total_submissions: 0,
      })
      .select()
      .single();

    if (insertError || !newUsage) {
      return { formsCreated: 0, totalSubmissions: 0, month };
    }

    return {
      formsCreated: newUsage.forms_created,
      totalSubmissions: newUsage.total_submissions,
      month: newUsage.month,
    };
  }

  return {
    formsCreated: data.forms_created,
    totalSubmissions: data.total_submissions,
    month: data.month,
  };
}

// Increment form count when creating a new form
export async function incrementFormCount(): Promise<void> {
  const { supabase, user } = await getUser();
  const month = getCurrentMonth();

  // Upsert: insert if not exists, increment if exists
  const { error } = await supabase.rpc('increment_form_count', {
    p_user_id: user.id,
    p_month: month,
  });

  // If RPC doesn't exist, do manual upsert
  if (error) {
    const { data: existing } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .single();

    if (existing) {
      await supabase
        .from('usage')
        .update({ forms_created: existing.forms_created + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('usage').insert({
        user_id: user.id,
        month: month,
        forms_created: 1,
        total_submissions: 0,
      });
    }
  }
}

// Increment submission count
export async function incrementSubmissionCount(formOwnerId: string): Promise<void> {
  const supabase = await createClient();
  const month = getCurrentMonth();

  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', formOwnerId)
    .eq('month', month)
    .single();

  if (existing) {
    await supabase
      .from('usage')
      .update({
        total_submissions: existing.total_submissions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('usage').insert({
      user_id: formOwnerId,
      month: month,
      forms_created: 0,
      total_submissions: 1,
    });
  }
}

// Check if user can create a new form
export async function canCreateForm(): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getSubscription();
  const usage = await getUsage();
  const limits = TIER_LIMITS[subscription.tier];

  // Unlimited forms
  if (limits.maxForms === -1) {
    return { allowed: true };
  }

  if (usage.formsCreated >= limits.maxForms) {
    return {
      allowed: false,
      message: `Anda telah mencapai had ${limits.maxForms} form untuk bulan ini. Upgrade ke Pro untuk form tanpa had!`,
    };
  }

  return { allowed: true };
}

// Check if form can accept more submissions
export async function canAcceptSubmission(
  formOwnerId: string
): Promise<{ allowed: boolean; message?: string }> {
  const supabase = await createClient();

  // Get form owner's subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', formOwnerId)
    .single();

  const tier = (sub?.tier || 'free') as SubscriptionTier;
  const limits = TIER_LIMITS[tier];

  // Unlimited submissions
  if (limits.maxSubmissionsPerForm === -1) {
    return { allowed: true };
  }

  // Get current month's usage
  const month = getCurrentMonth();
  const { data: usage } = await supabase
    .from('usage')
    .select('total_submissions')
    .eq('user_id', formOwnerId)
    .eq('month', month)
    .single();

  const currentSubmissions = usage?.total_submissions || 0;

  if (currentSubmissions >= limits.maxSubmissionsPerForm) {
    return {
      allowed: false,
      message: 'Form ini telah mencapai had pendaftaran untuk bulan ini.',
    };
  }

  return { allowed: true };
}

// Check if user can create a new certificate
export async function canCreateCertificate(): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getSubscription();
  const limits = TIER_LIMITS[subscription.tier];

  // Unlimited certificates
  if (limits.maxCertificates === -1) {
    return { allowed: true };
  }

  // We need to count existing certificates.
  // Ideally we should have a count function, but for now we import the getter.
  // To avoid circular dependency if getCertificateTemplates uses types from here (which is fine),
  // but if it uses subscription (circular), we might have issues.
  // Inspecting code: getCertificateTemplates is in lib/certificate-storage.ts.
  // It imports supabase/server, and types. It does NOT seem to import subscription.
  const { getCertificateTemplates } = await import('@/lib/certificate-storage');
  const templates = await getCertificateTemplates();

  if (templates.length >= limits.maxCertificates) {
    return {
      allowed: false,
      message: `Anda telah mencapai had ${limits.maxCertificates} sijil untuk plan Free. Upgrade ke Pro untuk sijil tanpa had!`,
    };
  }

  return { allowed: true };
}

// Get dashboard stats
export async function getDashboardStats(): Promise<{
  subscription: Subscription;
  usage: Usage;
  totalForms: number;
}> {
  const { supabase, user } = await getUser();

  const [subscription, usage, formsResult] = await Promise.all([
    getSubscription(),
    getUsage(),
    supabase.from('forms').select('id', { count: 'exact' }).eq('user_id', user.id),
  ]);

  return {
    subscription,
    usage,
    totalForms: formsResult.count || 0,
  };
}
