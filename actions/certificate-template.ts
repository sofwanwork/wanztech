'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveCertificateTemplate, deleteCertificateTemplate } from '@/lib/storage/certificates';
import { CertificateTemplate, CertificateElement, CertificateCategory, SubscriptionTier } from '@/lib/types';
import { createClient } from '@/utils/supabase/server';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';

import { canCreateCertificate, canUpdateCertificate } from '@/lib/storage/subscription';
import {
  getPresetById,
  adaptElementsForOrientation,
  resolvePresetForOrientation,
  type CertificateOrientation,
} from '@/lib/certificates/presets';

const VALID_CATEGORIES: CertificateCategory[] = [
  'school',
  'corporate',
  'training',
  'event',
  'other',
];

// Default elements for new certificates (1123 x 794 landscape)
const DEFAULT_ELEMENTS: CertificateElement[] = [
  {
    id: 'title',
    type: 'text',
    x: 561,
    y: 120,
    width: 500,
    height: 60,
    content: 'CERTIFICATE OF APPRECIATION',
    fontSize: 36,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  {
    id: 'subtitle',
    type: 'text',
    x: 561,
    y: 190,
    width: 400,
    height: 30,
    content: 'Awarded to',
    fontSize: 16,
    fontFamily: 'sans-serif',
    color: '#666666',
    textAlign: 'center',
  },
  {
    id: 'name-placeholder',
    type: 'placeholder',
    x: 561,
    y: 270,
    width: 600,
    height: 70,
    placeholderType: 'name',
    fontSize: 48,
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  {
    id: 'program-label',
    type: 'text',
    x: 561,
    y: 370,
    width: 400,
    height: 30,
    content: 'for participating in',
    fontSize: 16,
    fontFamily: 'sans-serif',
    color: '#666666',
    textAlign: 'center',
  },
  {
    id: 'program-placeholder',
    type: 'placeholder',
    x: 561,
    y: 420,
    width: 500,
    height: 50,
    placeholderType: 'program',
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  {
    id: 'date-placeholder',
    type: 'placeholder',
    x: 240,
    y: 650,
    width: 220,
    height: 30,
    placeholderType: 'date',
    fontSize: 14,
    fontFamily: 'sans-serif',
    color: '#666666',
    textAlign: 'center',
  },
];

export async function createCertificateTemplateAction(formData: FormData) {
  try {
    const categoryInput = formData.get('category') as string | null;
    const category: CertificateCategory = VALID_CATEGORIES.includes(
      categoryInput as CertificateCategory
    )
      ? (categoryInput as CertificateCategory)
      : 'other';

    // ── Single auth check ─────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // ── Parallel: subscription + certificate count ────────────────────────
    const [subResult, countResult] = await Promise.all([
      supabase.from('subscriptions').select('tier').eq('user_id', user.id).single(),
      supabase
        .from('certificate_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    const tier = (subResult.data?.tier || 'free') as SubscriptionTier;
    const limits = TIER_LIMITS[tier];
    const currentCount = countResult.count || 0;

    // Check limits
    if (limits.maxCertificates !== -1 && currentCount >= limits.maxCertificates) {
      const message = `You have reached the limit of ${limits.maxCertificates} certificates for the Free plan. Upgrade to Pro for unlimited certificates!`;
      return { error: message };
    }

    // ── Insert new template ───────────────────────────────────────────────
    const presetId = formData.get('preset') as string | null;
    const orientationInput = formData.get('orientation') as string | null;
    const orientation: CertificateOrientation =
      orientationInput === 'portrait' ? 'portrait' : 'landscape';

    const basePreset = presetId ? getPresetById(presetId) : undefined;
    const resolvedPreset = basePreset
      ? resolvePresetForOrientation(basePreset, orientation)
      : undefined;
    const fallbackLayout = resolvedPreset
      ? null
      : adaptElementsForOrientation(DEFAULT_ELEMENTS, 1123, 794, orientation);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        user_id: user.id,
        name: resolvedPreset ? resolvedPreset.name : 'New Certificate',
        category: resolvedPreset ? resolvedPreset.category : category,
        elements: resolvedPreset ? resolvedPreset.elements : fallbackLayout!.elements,
        background_color: resolvedPreset ? resolvedPreset.backgroundColor : '#ffffff',
        width: resolvedPreset ? resolvedPreset.width : fallbackLayout!.width,
        height: resolvedPreset ? resolvedPreset.height : fallbackLayout!.height,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating certificate template:', error);
      return { error: `Failed to create new certificate: ${error?.message || 'No ID returned'}` };
    }

    return { success: true, id: data.id };
  } catch (error) {
    // If it's a redirect error, DO NOT catch it because Next.js needs it to navigate.
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Action error:', error);
    return { error: 'Failed to connect to the database.' };
  }
}

export async function updateCertificateTemplateAction(
  id: string,
  data: Partial<CertificateTemplate>
) {
  // Check limits before update
  const { allowed, message } = await canUpdateCertificate();
  if (!allowed) {
    return { error: message || 'Limit exceeded' };
  }

  const template = await saveCertificateTemplate({
    id,
    ...data,
  });

  if (template) {
    revalidatePath('/certificates/builder');
    revalidatePath(`/certificates/builder/${id}`);
    return { success: true, template };
  }

  return { error: 'Failed to update template' };
}

export async function deleteCertificateTemplateAction(id: string) {
  const success = await deleteCertificateTemplate(id);

  if (success) {
    revalidatePath('/certificates/builder');
    redirect('/certificates/builder');
  }

  return { error: 'Failed to delete template' };
}

export async function cloneCertificateTemplateAction(id: string): Promise<void> {
  // Get existing template
  const { getCertificateTemplate } = await import('@/lib/storage/certificates');
  const existingTemplate = await getCertificateTemplate(id);

  if (!existingTemplate) {
    return;
  }

  // Check limits
  const { allowed, message } = await canCreateCertificate();
  if (!allowed) {
    redirect('/certificates/builder?error=' + encodeURIComponent(message || 'Limit reached'));
  }

  // Create new template with copied data
  const newTemplate = await saveCertificateTemplate({
    name: `${existingTemplate.name} (Copy)`,
    elements: existingTemplate.elements,
    backgroundColor: existingTemplate.backgroundColor,
    backgroundImage: existingTemplate.backgroundImage,
    width: existingTemplate.width,
    height: existingTemplate.height,
  });

  if (newTemplate) {
    revalidatePath('/certificates/builder');
    redirect(`/certificates/builder/${newTemplate.id}`);
  }
}
