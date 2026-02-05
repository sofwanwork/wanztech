import { createClient } from '@/utils/supabase/server';
import { Settings } from '@/lib/types';

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

export async function getSettings(): Promise<Settings | undefined> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return undefined;

  return {
    googleClientEmail: data.google_client_email,
    googlePrivateKey: data.google_private_key,
    googleDriveFolderId: data.google_drive_folder_id,
    userPersonalEmail: data.user_personal_email,
  };
}

// Get settings by form ID (for public form submission - doesn't require auth)
export async function getSettingsByFormId(formId: string): Promise<Settings | undefined> {
  const supabase = await createClient();

  // First, get the form to find the owner (user_id)
  const { data: formData, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !formData) return undefined;

  // Then get the settings for that user
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', formData.user_id)
    .single();

  if (error || !data) return undefined;

  return {
    googleClientEmail: data.google_client_email,
    googlePrivateKey: data.google_private_key,
    googleDriveFolderId: data.google_drive_folder_id,
    userPersonalEmail: data.user_personal_email,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { supabase, user } = await getUser();

  const settingsData = {
    user_id: user.id,
    google_client_email: settings.googleClientEmail,
    google_private_key: settings.googlePrivateKey,
    google_drive_folder_id: settings.googleDriveFolderId,
    user_personal_email: settings.userPersonalEmail,
  };

  const { error } = await supabase.from('settings').upsert(settingsData);

  if (error) throw error;
}
