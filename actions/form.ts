'use server';

import { v4 as uuidv4 } from 'uuid';
import { saveForm, getFormById, deleteForm } from '@/lib/storage';
import { Form, Settings } from '@/lib/types';
import { appendToSheet } from '@/lib/google-sheets';
import { uploadToDrive } from '@/lib/google-drive';
import { redirect } from 'next/navigation';
import { canCreateForm, incrementFormCount } from '@/lib/subscription';

// --- Types ---
// Re-exporting Form types for client use if needed, but usually we just use the lib/storage types.

// --- Settings Storage for Credentials ---
// Replaced by lib/storage which uses Supabase
import { getSettings, saveSettings, getSettingsByFormId } from '@/lib/storage';

export async function saveSettingsAction(settings: Settings) {
  await saveSettings(settings);
}

export async function getSettingsAction() {
  return await getSettings();
}

// --- Form Actions ---

export async function createFormAction(formData: Partial<Form>) {
  // Check if settings exist before creating form
  const settings = await getSettings();
  if (!settings || !settings.googleClientEmail || !settings.googlePrivateKey) {
    redirect('/settings?error=missing_config');
  }

  // Check tier limits
  const limitCheck = await canCreateForm();
  if (!limitCheck.allowed) {
    redirect(`/?error=${encodeURIComponent(limitCheck.message || 'Form limit reached')}`);
  }

  const id = uuidv4();
  const newForm: Form = {
    id,
    title: formData.title || 'Untitled Form',
    description: formData.description || '',
    coverImage: formData.coverImage || '',
    googleSheetUrl: formData.googleSheetUrl || '',
    fields: formData.fields || [],
    createdAt: new Date().toISOString(),
  };

  await saveForm(newForm);

  // Increment form count for this month
  await incrementFormCount();

  redirect(`/builder/${id}`);
}

export async function updateFormAction(form: Form) {
  await saveForm(form);
  // No redirect, just save state
  return { success: true };
}

export async function deleteFormAction(id: string) {
  await deleteForm(id);
  redirect('/');
}

// --- Public Submission ---

export async function submitFormAction(
  formId: string,
  formDataOrObj: FormData | Record<string, string | number | boolean>
) {
  const form = await getFormById(formId);
  if (!form) return { success: false, error: 'Form not found' };

  // Check submission limit for form owner
  // We need to get form owner's user_id from the form
  // For now, we'll track submissions but skip limit check (requires form owner id)
  // TODO: Add form owner check when we have user_id in form table

  // --- Process FormData ---
  // We need to convert FormData to a plain object for Google Sheets
  // AND upload any files to Drive.

  let dbData: Record<string, string | number | boolean | null | undefined> = {};

  // Use getSettingsByFormId for public form submission (no auth required)
  const settings = await getSettingsByFormId(formId);
  // Default to empty object if undefined
  const safeSettings = settings || {};

  if (formDataOrObj instanceof FormData) {
    // Handle FormData
    for (const [key, value] of Array.from(formDataOrObj.entries())) {
      if (value instanceof File) {
        // Skip empty files (0 bytes)
        if (value.size === 0) {
          dbData[key] = ''; // Empty value for empty file
          continue;
        }
        // Upload File
        try {
          console.log(`Uploading file for field: ${key}`);
          // Use folderId from settings
          const uploadResult = await uploadToDrive(value, safeSettings.googleDriveFolderId);

          // Save Link to DB Data
          dbData[key] = uploadResult.viewLink; // or downloadLink
        } catch (e) {
          console.error('File Upload Failed:', e);
          dbData[key] = `Error Uploading File: ${value.name}`;
        }
      } else {
        dbData[key] = value;
      }
    }
  } else {
    // Legacy plain object support
    dbData = formDataOrObj;
  }

  // 2. Send to Google Sheet
  if (form.googleSheetUrl) {
    if (safeSettings.googleClientEmail && safeSettings.googlePrivateKey) {
      const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

      function formatPrivateKey(key: string) {
        let clean = key.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
        if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
        return clean;
      }

      if (match && match[1]) {
        const sheetId = match[1];
        const pk = formatPrivateKey(safeSettings.googlePrivateKey);

        try {
          const result = await appendToSheet(
            {
              sheetId,
              clientEmail: safeSettings.googleClientEmail,
              privateKey: pk,
            },
            dbData
          ); // Use processed dbData

          if (!result.success) {
            return {
              success: false,
              error: 'Saved locally but failed to sync to Sheets: ' + result.error,
            };
          }
        } catch (e) {
          return { success: false, error: 'Unexpected error: ' + e };
        }
      } else {
        // Invalid Sheet URL format
        return {
          success: false,
          error: 'Invalid Google Sheet URL format. Please check the URL in form settings.',
        };
      }
    } else {
      console.warn('Google Sheet URL present but credentials missing.');
      return { success: false, error: 'Google credentials not configured. Please check Settings.' };
    }
  }

  // Note: Submission count tracking will be done when we add form owner tracking
  // For now, successful submissions are recorded in Google Sheets

  return { success: true };
}
