'use server';

import { v4 as uuidv4 } from 'uuid';
import { saveForm, getFormById, deleteForm } from '@/lib/storage/forms';
import { Form, Settings } from '@/lib/types';
import { appendToSheet } from '@/lib/api/google-sheets';
import { uploadToDrive } from '@/lib/api/google-drive';
import { redirect } from 'next/navigation';
import {
  canCreateForm,
  incrementFormCount,
  canUpdateForm,
  canSubmitForm,
  incrementSubmissionCount,
} from '@/lib/storage/subscription';
import { sendEmail, getNewSubmissionEmail } from '@/lib/email';
import { createAdminClient } from '@/utils/supabase/admin';
import { encrypt } from '@/lib/encryption';
import { sanitizeHtml } from '@/lib/utils'; // Import sanitization
import { headers as getNextHeaders } from 'next/headers';

// ─── Submission Rate Limiter (per submitter IP) ──────────────────────────────
// Prevents spam flooding of public forms. Resets on cold start.
// For distributed deployments, replace with Redis-based solution.
const submitRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const SUBMIT_RATE_LIMIT = 20;          // max 20 submissions per window per IP
const SUBMIT_RATE_WINDOW_MS = 60_000;  // 1 minute

function isSubmitRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submitRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    submitRateLimitMap.set(ip, { count: 1, resetAt: now + SUBMIT_RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= SUBMIT_RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// --- Types ---
// Re-exporting Form types for client use if needed, but usually we just use the lib/storage types.

// --- Settings Storage for Credentials ---
// Replaced by lib/storage which uses Supabase
import { getSettings, saveSettings, getSettingsByFormId } from '@/lib/storage/settings';

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
    redirect(`/forms?error=${encodeURIComponent(limitCheck.message || 'Form limit reached')}`);
  }

  const id = uuidv4();
  const description = formData.description ? sanitizeHtml(formData.description) : '';
  const thankYouMessage = formData.thankYouMessage ? sanitizeHtml(formData.thankYouMessage) : '';

  const newForm: Form = {
    id,
    title: formData.title || 'Untitled Form',
    description,
    coverImage: formData.coverImage || '',
    googleSheetUrl: formData.googleSheetUrl || '',
    fields: formData.fields || [],
    createdAt: new Date().toISOString(),
    thankYouMessage,
  };

  await saveForm(newForm);

  // Increment form count for this month
  await incrementFormCount();

  redirect(`/builder/${id}`);
}

export async function updateFormAction(form: Form) {
  try {
    // Check limits before update
    const { allowed, message } = await canUpdateForm();
    if (!allowed) {
      return { success: false, error: message || 'Limit exceeded' };
    }

    // Sanitize rich text fields
    if (form.description) {
      form.description = sanitizeHtml(form.description);
    }
    if (form.thankYouMessage) {
      form.thankYouMessage = sanitizeHtml(form.thankYouMessage);
    }

    await saveForm(form);
    // No redirect, just save state
    return { success: true };
  } catch (error) {
    console.error('Update Form Action Error:', error);
    return {
      success: false,
      error:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'Failed to save form changes',
    };
  }
}

export async function deleteFormAction(id: string) {
  await deleteForm(id);
  redirect('/forms');
}

// --- Public Submission ---

// --- Constants ---
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/csv',
];

export async function submitFormAction(
  formId: string,
  formDataOrObj: FormData | Record<string, string | number | boolean>
) {
  // Security: IP-based rate limiting to prevent spam/flood of public forms
  const headersList = await getNextHeaders();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  if (isSubmitRateLimited(ip)) {
    return { success: false, error: 'Terlalu banyak percubaan. Sila cuba lagi selepas 1 minit.' };
  }

  // --- Anti-Bot: Honeypot Check ---
  if (formDataOrObj instanceof FormData) {
    if (formDataOrObj.get('_gotcha')) {
      console.warn('Bot detected by honeypot! IP:', ip);
      return { success: true }; // Silently trick the bot
    }
  } else if ('_gotcha' in formDataOrObj && formDataOrObj['_gotcha']) {
    console.warn('Bot detected by honeypot (JSON)! IP:', ip);
    return { success: true }; // Silently trick the bot
  }

  const form = await getFormById(formId);
  if (!form) return { success: false, error: 'Form not found' };

  // --- Active Status Check ---
  if (form.isActive === false) {
    return { success: false, error: 'Borang telah ditutup oleh penganjur.' };
  }

  // 1. Rate Limiting / Quota Check
  if (form.userId) {
    try {
      const allowed = await canSubmitForm(form.userId);
      if (!allowed) {
        return { success: false, error: 'Form submission limit reached for this month.' };
      }
    } catch (e) {
      console.error('Rate limit check failed:', e);
      // Fail open or closed? consistently closed for safety
      return { success: false, error: 'System busy, please try again.' };
    }
  }

  // 2. Server-Side Input Validation
  // Transform input to a standard map for validation
  const inputData: Record<string, unknown> = {};

  if (formDataOrObj instanceof FormData) {
    for (const [key, value] of Array.from(formDataOrObj.entries())) {
      inputData[key] = value;
    }
  } else {
    Object.assign(inputData, formDataOrObj);
  }

  // Validate against Form Fields
  for (const field of form.fields) {
    // Skip hidden/inactive fields logic for now (too complex to simulate client condition logic perfectly on server without massive duplication)
    // But we MUST enforce 'required' and 'validity' for fields that ARE submitted.

    const value = inputData[field.label] || inputData[field.id]; // client sends label or id? client.tsx sends label usually
    // Wait, client.tsx sends `formDataToSend.append(field.label, value)`
    // So we key off label. This is fragile if labels change, but that's how it is built.
    // Let's key off label for now.

    // Check Required
    if (field.required && !value && value !== 0 && value !== false) {
      // Basic server-side validation: If required, it must have a value.
      // We skip this check ONLY if we can determine the field was hidden (not sent).
      // However, HTML forms usually don't send anything for empty fields anyway.
      // If we want to be strict, we assume all required fields MUST be present.
      // Conditional logic is hard to replicate here without the full rules engine.
      // For now, we enforce "If it's in the schema as required, it must be provided".
      // This might break if conditional logic hides it on client side.
      // Trade-off: Security vs Complexity.
      // Allow bypass if value is strictly null/undefined/empty string.
      // Client usually appends empty string for empty text inputs.

      return { success: false, error: `${field.label} is required.` };
    }

    // Validate String constraints
    if (typeof value === 'string') {
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return { success: false, error: `${field.label} is too short.` };
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return { success: false, error: `${field.label} is too long.` };
      }
      if (field.validation?.pattern) {
        try {
          // Security: Limit string length before running user-supplied regex
          // to mitigate potential ReDoS (Regex Denial of Service) attacks.
          const MAX_REGEX_INPUT = 1000;
          const testValue = value.length > MAX_REGEX_INPUT ? value.slice(0, MAX_REGEX_INPUT) : value;
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(testValue)) {
            return { success: false, error: `${field.label} format is invalid.` };
          }
        } catch {
          // If the stored regex pattern is invalid, skip pattern validation
          // rather than crashing the server.
          console.warn(`Invalid regex pattern for field "${field.label}". Skipping pattern check.`);
        }
      }
    }
  }

  // --- Process & Upload ---
  let dbData: Record<string, string | number | boolean | null | undefined> = {};

  // Use getSettingsByFormId for public form submission (no auth required)
  // This now uses admin client internally to fetch settings safely
  const settings = await getSettingsByFormId(formId);
  const safeSettings = settings || {};
  let accessToken = settings?.googleAccessToken;

  // 1. Check & Refresh Token (Global Check before any Google operation)
  if (accessToken && settings?.googleRefreshToken && settings?.googleTokenExpiry) {
    // Check if expired (or expiring in 5 mins)
    if (Date.now() > settings.googleTokenExpiry - 300000) {
      console.log('Access token expired, refreshing...');
      try {
        const { refreshAccessToken } = await import('@/lib/api/google-auth');

        const newCreds = await refreshAccessToken(settings.googleRefreshToken);

        if (newCreds.access_token) {
          accessToken = newCreds.access_token;
          // Update in-memory settings for immediate use
          if (safeSettings) safeSettings.googleAccessToken = accessToken;

          // Save refreshed token to DB using Admin Client
          // Use admin client because public user cannot write to settings
          const adminSupabase = createAdminClient();

          const updateData: Record<string, unknown> = {
            google_access_token: encrypt(accessToken),
            updated_at: new Date().toISOString()
          };

          if (newCreds.expiry_date) {
            updateData.google_token_expiry = newCreds.expiry_date;
          }

          // We need form owner ID. getSettingsByFormId doesn't return it, but form object has it.
          // form.userId is available from getFormById check above
          if (form.userId) {
            await adminSupabase
              .from('settings')
              .update(updateData)
              .eq('user_id', form.userId);
            console.log('Refreshed token saved to DB');
          }
        }
      } catch (e) {
        console.error('Token refresh failed:', e);
        // Fallback to old token or service account?
      }
    }
  }

  if (formDataOrObj instanceof FormData) {
    // Handle FormData
    for (const [key, value] of Array.from(formDataOrObj.entries())) {
      if (value instanceof File) {
        // Security: File Validation
        if (value.size > MAX_FILE_SIZE) {
          return { success: false, error: `File ${value.name} exceeds 10MB limit.` };
        }
        if (!ALLOWED_MIME_TYPES.includes(value.type)) {
          return { success: false, error: `File type ${value.type} not allowed.` };
        }

        // Skip empty files (0 bytes)
        if (value.size === 0) {
          dbData[key] = '';
          continue;
        }

        // Upload File
        try {
          console.log(`Uploading file for field: ${key}`);
          // Pass safeSettings (which has potentially refreshed token)
          const uploadResult = await uploadToDrive(value, safeSettings.googleDriveFolderId, safeSettings);
          dbData[key] = uploadResult.viewLink;
        } catch (e) {
          console.error('File Upload Failed:', e);
          return { success: false, error: 'File upload failed.' };
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
  if (form.googleSheetUrl && settings) {
    if (accessToken || (settings.googleClientEmail && settings.googlePrivateKey)) {
      const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);

      function formatPrivateKey(key: string) {
        let clean = key.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
        if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
        return clean;
      }

      if (match && match[1]) {
        const sheetId = match[1];
        const pk = settings.googlePrivateKey ? formatPrivateKey(settings.googlePrivateKey) : undefined;

        try {
          const result = await appendToSheet(
            {
              sheetId,
              clientEmail: settings.googleClientEmail,
              privateKey: pk,
              accessToken: accessToken, // Use the (potentially refreshed) accessToken
            },
            dbData
          );

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
        return { success: false, error: 'Invalid Google Sheet URL' };
      }
    } else {
      console.warn('Google Sheet URL present but credentials missing.');
      return { success: false, error: 'Google credentials not configured.' };
    }
  }

  // Increment Usage Stats if successful
  if (form.userId) {
    await incrementSubmissionCount(form.userId);

    // Send email notification (awaited so serverless doesn't kill it before completion)
    try {
      if (form.receiveEmailNotifications !== false) {
        const admin = createAdminClient();
        const { data: userData } = await admin.auth.admin.getUserById(form.userId!);
        const ownerEmail = userData?.user?.email;
        const ownerName =
          userData?.user?.user_metadata?.full_name ||
          userData?.user?.user_metadata?.username ||
          'User';

        if (ownerEmail) {
          const submissionSummary: Record<string, string> = {};
          for (const [key, val] of Object.entries(dbData)) {
            if (val !== null && val !== undefined) {
              submissionSummary[key] = String(val);
            }
          }
          const emailContent = getNewSubmissionEmail(
            ownerName,
            form.title,
            submissionSummary,
            form.googleSheetUrl
          );
          await sendEmail({
            to: ownerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      }
    } catch (emailErr) {
      // Never fail submission because of email
      console.warn('Submission email notification failed:', emailErr);
    }
  }

  return { success: true };
}
