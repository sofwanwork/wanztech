import { createClient } from '@/utils/supabase/server';
import { Form, Profile } from '@/lib/types';

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

export async function getForms(): Promise<Form[]> {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching forms:', error);
    return [];
  }

  // Map db fields to camelCase
  interface DbFormRow {
    id: string;
    title: string;
    description: string;
    cover_image: string | null;
    thank_you_message: string | null;
    google_sheet_url: string | null;
    fields: unknown[] | null;
    created_at: string;
    short_code: string | null;
    e_certificate_enabled: boolean;
    e_certificate_template: unknown;
    attendance_settings: unknown;
    qr_settings: unknown;
    theme: unknown;
  }
  return data.map((f: DbFormRow) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    coverImage: f.cover_image ?? undefined,
    thankYouMessage: f.thank_you_message ?? undefined,
    googleSheetUrl: f.google_sheet_url ?? undefined,
    fields: (f.fields as Form['fields']) || [],
    createdAt: f.created_at,
    shortCode: f.short_code ?? undefined,
    eCertificateEnabled: f.e_certificate_enabled,
    eCertificateTemplate: f.e_certificate_template as Form['eCertificateTemplate'],
    attendanceSettings: f.attendance_settings as Form['attendanceSettings'],
    qrSettings: f.qr_settings as Form['qrSettings'],
    theme: f.theme as Form['theme'],
  }));
}

export async function getFormById(id: string): Promise<Form | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('forms').select('*').eq('id', id).single();

  if (error || !data) return undefined;

  // Fetch subscription tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', data.user_id)
    .single();

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverImage: data.cover_image,
    thankYouMessage: data.thank_you_message,
    googleSheetUrl: data.google_sheet_url,
    allowMultipleSubmissions: data.allow_multiple_submissions,
    fields: data.fields || [], // Fallback to empty array if null
    createdAt: data.created_at,
    shortCode: data.short_code,
    eCertificateEnabled: data.e_certificate_enabled,
    eCertificateTemplate: data.e_certificate_template,
    attendanceSettings: data.attendance_settings,
    qrSettings: data.qr_settings,
    theme: data.theme,
    userTier: (subscription?.tier as Form['userTier']) || 'free',
  };
}

export async function getFormByShortCode(code: string): Promise<Form | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('forms').select('*').eq('short_code', code).single();

  if (error || !data) return undefined;

  // Fetch subscription tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', data.user_id)
    .single();

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverImage: data.cover_image,
    thankYouMessage: data.thank_you_message,
    googleSheetUrl: data.google_sheet_url,
    allowMultipleSubmissions: data.allow_multiple_submissions,
    fields: data.fields || [],
    createdAt: data.created_at,
    shortCode: data.short_code,
    eCertificateEnabled: data.e_certificate_enabled,
    eCertificateTemplate: data.e_certificate_template,
    attendanceSettings: data.attendance_settings,
    qrSettings: data.qr_settings,
    theme: data.theme,
    userTier: (subscription?.tier as Form['userTier']) || 'free',
  };
}

export async function saveForm(form: Form): Promise<void> {
  const { supabase, user } = await getUser();

  // Security check: If form exists, ensure it belongs to the user
  if (form.id) {
    const { data: existing } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', form.id)
      .single();

    if (existing && existing.user_id !== user.id) {
      console.error(`Unauthorized attempt to update form ${form.id} by user ${user.id}`);
      throw new Error('Unauthorized');
    }
  }

  // Prepare snake_case data
  const formData = {
    id: form.id,
    user_id: user.id,
    title: form.title,
    description: form.description,
    cover_image: form.coverImage,
    thank_you_message: form.thankYouMessage,
    google_sheet_url: form.googleSheetUrl,
    allow_multiple_submissions: form.allowMultipleSubmissions,
    fields: form.fields, // jsonb handles array automatically
    e_certificate_enabled: form.eCertificateEnabled,
    e_certificate_template: form.eCertificateTemplate,
    attendance_settings: form.attendanceSettings,
    qr_settings: form.qrSettings,
    theme: form.theme,
    // created_at is default now(), but for updates we might want to keep original or allow db to handle.
    // If we pass id, upsert works.
  };

  const { error } = await supabase.from('forms').upsert(formData);

  if (error) {
    console.error('Error saving form:', error);
    throw error;
  }
}

export async function deleteForm(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  const { error } = await supabase.from('forms').delete().eq('id', id).eq('user_id', user.id);

  if (error) throw error;
}

export async function getProfile(): Promise<Profile | undefined> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    avatar_url: data.avatar_url,
  };
}
