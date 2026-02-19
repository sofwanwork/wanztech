import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { Settings } from '@/lib/types';
import { encrypt, decrypt } from '@/lib/encryption';

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
    googleClientEmail: decrypt(data.google_client_email),
    googlePrivateKey: decrypt(data.google_private_key),
    googleDriveFolderId: decrypt(data.google_drive_folder_id),
    userPersonalEmail: data.user_personal_email,
    googleAccessToken: decrypt(data.google_access_token),
    googleRefreshToken: decrypt(data.google_refresh_token),
    googleTokenExpiry: data.google_token_expiry,
  };
}

// Get settings by form ID (for public form submission - using admin client to bypass RLS)
export async function getSettingsByFormId(formId: string): Promise<Settings | undefined> {
  const supabase = await createClient();

  // First, get the form to find the owner (user_id)
  // Forms are public readable, so standard client is fine here.
  const { data: formData, error: formError } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', formId)
    .single();

  if (formError || !formData) return undefined;

  // Then get the settings for that user using Admin Client
  // Public users strictly cannot read settings table via RLS
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('settings')
    .select('*')
    .eq('user_id', formData.user_id)
    .single();

  if (error || !data) return undefined;

  return {
    googleClientEmail: decrypt(data.google_client_email),
    googlePrivateKey: decrypt(data.google_private_key),
    googleDriveFolderId: decrypt(data.google_drive_folder_id),
    userPersonalEmail: data.user_personal_email,
    googleAccessToken: decrypt(data.google_access_token),
    googleRefreshToken: decrypt(data.google_refresh_token),
    googleTokenExpiry: data.google_token_expiry,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { supabase, user } = await getUser();

  const settingsData = {
    user_id: user.id,
    google_client_email: settings.googleClientEmail ? encrypt(settings.googleClientEmail) : null,
    google_private_key: settings.googlePrivateKey ? encrypt(settings.googlePrivateKey) : null,
    google_drive_folder_id: settings.googleDriveFolderId
      ? encrypt(settings.googleDriveFolderId)
      : null,
    user_personal_email: settings.userPersonalEmail || null,
    // OAuth Fields - preserve existing if not provided (though usually we save what we have)
    // Actually, saveSettings usually receives a full object from the form.
    // But for OAuth, the callback updates these fields directly in DB.
    // If we save from the Settings form, we might overwrite them with undefined if the form doesn't include them?
    // The Settings form (client side) calls `getSettings` which returns them.
    // So if we pass them back, we should save them.
    google_access_token: settings.googleAccessToken ? encrypt(settings.googleAccessToken) : undefined, // undefined to skip update if missing? No, standard upsert replaces.
    // Wait, the Settings page form DOES NOT have fields for tokens.
    // So if users click "Save Settings", `settings.googleAccessToken` will be undefined.
    // If we send `null` or `undefined` to upsert, it might overwrite existing tokens!
    // We should NOT update tokens here if they are undefined, 
    // OR we must ensure getSettings returns them and the form retains them.
    // Strategy: Only update fields that are explicitly in the `settings` object AND relevant for the form.
    // Since `saveSettingsAction` takes a `Settings` object, let's look at `actions/forms.ts`.
    // It passes strict structure.
  };

  // Filter out undefined keys to avoid overwriting with null if we don't want to?
  // Supabase upsert: if value is missing from object, it doesn't touch the column? No, that's 'update'.
  // 'upsert' requires a full row usually or defaults?
  // Actually, supabase-js `upsert`... if we omit a key, does it set to null or keep existing?
  // It effectively REPLACES the row if it exists (update).
  // If we omit a column in the `updates` object, it SHOULD keep the existing value for that column (partial update).
  // Let's verify: "Performing an UPSERT... If the row exists, the columns included in the object are updated."
  // So omitting them is safer if the frontend doesn't send them.

  if (settings.googleAccessToken !== undefined) {
    (settingsData as any).google_access_token = settings.googleAccessToken ? encrypt(settings.googleAccessToken) : null;
  }
  if (settings.googleRefreshToken !== undefined) {
    (settingsData as any).google_refresh_token = settings.googleRefreshToken ? encrypt(settings.googleRefreshToken) : null;
  }
  if (settings.googleTokenExpiry !== undefined) {
    (settingsData as any).google_token_expiry = settings.googleTokenExpiry;
  }

  const { error } = await supabase.from('settings').upsert(settingsData);

  if (error) throw error;
}
