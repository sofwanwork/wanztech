'use server';

import { v4 as uuidv4 } from 'uuid';
import { saveForm, getFormById, deleteForm } from '@/lib/storage/forms';
import { Form, Settings } from '@/lib/types';
import { appendToSheet } from '@/lib/api/google-sheets';
import { uploadToDrive } from '@/lib/api/google-drive';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
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
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { requiresPdpaConsent, isPdpaSubmissionAllowed } from '@/lib/forms/pdpa';
import { validateSubmission } from '@/lib/forms/validate-submission';
import { logAudit } from '@/lib/storage/audit';
import {
  insertFormResponse,
  markResponseSynced,
  markResponseSyncFailed,
} from '@/lib/storage/form-responses';

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
  // Check if settings exist before creating form (supports OAuth or Service Account)
  const settings = await getSettings();
  const hasOAuth = !!(settings?.googleAccessToken);
  const hasServiceAccount = !!(settings?.googleClientEmail && settings?.googlePrivateKey);

  if (!settings || (!hasOAuth && !hasServiceAccount)) {
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

  await logAudit({
    action: 'form.create',
    entityType: 'form',
    entityId: id,
    metadata: { title: newForm.title },
  });

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
  const existing = await getFormById(id);
  await deleteForm(id);
  await logAudit({
    action: 'form.delete',
    entityType: 'form',
    entityId: id,
    metadata: existing?.title ? { title: existing.title } : {},
  });
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

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

export async function submitFormAction(
  formId: string,
  formDataOrObj: FormData | Record<string, string | number | boolean>,
  clientSubmissionId?: string
) {
  // Security: IP-based rate limiting to prevent spam/flood of public forms
  const headersList = await getNextHeaders();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'form-submit');
  if (!rl.success) {
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

  // --- PDPA Consent Enforcement ---
  // If the form requires PDPA consent, the client must send `_pdpa_consent`.
  // Enforced server-side so the gate can't be bypassed by scripting the action.
  if (requiresPdpaConsent(form.pdpaSettings)) {
    const consent =
      formDataOrObj instanceof FormData
        ? formDataOrObj.get('_pdpa_consent')
        : (formDataOrObj as Record<string, unknown>)['_pdpa_consent'];
    if (!isPdpaSubmissionAllowed(form.pdpaSettings, consent)) {
      return {
        success: false,
        error: 'Persetujuan PDPA diperlukan untuk menghantar borang ini.',
      };
    }
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

  // Validate against the form schema. Reuses the SAME conditional-logic
  // evaluator as the public client, so a required field hidden by
  // conditional rules is no longer rejected server-side, and layout-only
  // fields are skipped.
  const validation = validateSubmission(form.fields, inputData);
  if (!validation.ok) {
    return { success: false, error: validation.error ?? 'Validation failed.' };
  }

  // --- Process & Upload ---
  let dbData: Record<string, string | number | boolean | null | undefined> = {};

  // Stable submission id — used as the idempotency key (duplicate submits
  // are silently swallowed) and kept in a hidden Sheet column so the
  // edit-link flow can locate this row later.
  const submissionId = clientSubmissionId && /^[0-9a-f-]{32,36}$/i.test(clientSubmissionId)
    ? clientSubmissionId
    : uuidv4();

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

  // Bookkeeping columns (`_submission_id`, `timestamp`) are only useful for the
  // magic-link edit feature, which needs to locate this exact row later. When
  // Edit Link is OFF, keep the Sheet clean — just the respondent's answers.
  const editLinkEnabled = !!form.editLinkSettings?.enabled;
  if (editLinkEnabled) {
    dbData._submission_id = submissionId;
  } else {
    delete dbData._submission_id;
    delete dbData.timestamp;
  }

  // Record PDPA consent as a human-friendly column and drop the raw internal
  // flag so the Sheet shows "PDPA Consent: Yes" rather than "_pdpa_consent".
  if ('_pdpa_consent' in dbData) {
    const consented = String(dbData._pdpa_consent) === 'true';
    delete dbData._pdpa_consent;
    if (form.pdpaSettings?.enabled) {
      dbData['PDPA Consent'] = consented ? 'Yes' : 'No';
    }
  }

  // ============================================================
  // WRITE-FIRST: persist locally BEFORE touching Google Sheets.
  //
  // Previously the response went straight to Sheets and was lost forever
  // on failure (the "Saved locally but failed to sync" message was a lie —
  // nothing was saved). Now the DB row is the durable source of truth and
  // the Sheet sync happens in the background via after(). If Sheets is
  // down, the respondent still succeeds and the retry cron catches up.
  // ============================================================
  if (form.userId) {
    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(dbData)) {
      if (v !== null && v !== undefined) stringData[k] = String(v);
    }

    const insertResult = await insertFormResponse({
      submissionId,
      formId: form.id,
      userId: form.userId,
      data: stringData,
    });

    if (insertResult === 'duplicate') {
      // Same submission already stored (double-click / double-send).
      // Idempotent success — do not double-write the Sheet or re-send emails.
      console.warn('[submit] duplicate submission swallowed:', submissionId);
      return { success: true };
    }
    if (insertResult === 'error') {
      return {
        success: false,
        error: 'Gagal menyimpan jawapan anda. Sila cuba sebentar lagi.',
      };
    }
  }

  // Increment Usage Stats if successful
  if (form.userId) {
    await incrementSubmissionCount(form.userId);
  }

  // Snapshot everything the background work needs BEFORE after() — the
  // request context (headers etc.) is not safe to read once the response
  // has been flushed.
  const origin =
    headersList.get('origin') ||
    (process.env.NEXT_PUBLIC_APP_URL ?? 'https://klikform.com');

  const formSnapshot: Form = form;
  const settingsSnapshot: Settings | undefined = settings;
  const accessTokenSnapshot = accessToken;
  const dbDataSnapshot: Record<string, string | number | boolean | null | undefined> = dbData;

  // --- Background work: Sheets sync + webhooks + 3 email flows ---
  // All moved off the respondent's critical path via after(). A slow webhook
  // receiver (5s × 3 retries ≈ 15s+) previously blocked their HTTP response
  // and risked serverless timeouts.
  after(async () => {
    if (!formSnapshot.userId) return;

    // 1. Google Sheets sync (best-effort now; retry cron catches failures)
    if (formSnapshot.googleSheetUrl && settingsSnapshot) {
      if (accessTokenSnapshot || (settingsSnapshot.googleClientEmail && settingsSnapshot.googlePrivateKey)) {
        const match = formSnapshot.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          const pk = settingsSnapshot.googlePrivateKey
            ? formatPrivateKey(settingsSnapshot.googlePrivateKey)
            : undefined;
          try {
            const result = await appendToSheet(
              {
                sheetId,
                clientEmail: settingsSnapshot.googleClientEmail,
                privateKey: pk,
                accessToken: accessTokenSnapshot,
              },
              dbDataSnapshot
            );
            if (result.success) {
              await markResponseSynced(submissionId);
            } else {
              // stays 'pending' → picked up by the /api/cron/sync-responses retry
              await markResponseSyncFailed(submissionId, result.error ?? 'unknown');
            }
          } catch (e) {
            await markResponseSyncFailed(submissionId, e instanceof Error ? e.message : 'unknown');
          }
        }
      }
    }

    // 2. Outgoing webhooks (fire-and-forget)
    try {
      const { listWebhooksForDispatch, recordWebhookResult } = await import(
        '@/lib/storage/webhooks'
      );
      const { dispatchWebhook } = await import('@/lib/webhooks/dispatch');
      const hooks = await listWebhooksForDispatch(formSnapshot.id, formSnapshot.userId, 'submission');
      if (hooks.length > 0) {
        const stringData: Record<string, string> = {};
        for (const [k, v] of Object.entries(dbDataSnapshot)) {
          if (v !== null && v !== undefined) stringData[k] = String(v);
        }
        const payload = {
          event: 'submission' as const,
          formId: formSnapshot.id,
          formTitle: formSnapshot.title,
          submittedAt: new Date().toISOString(),
          data: stringData,
        };
        await Promise.all(
          hooks.map(async (hook) => {
            const result = await dispatchWebhook({
              url: hook.url,
              secret: hook.secret,
              payload,
            });
            await recordWebhookResult(hook.id, {
              status: result.status,
              error: result.error ?? null,
            });
          })
        );
      }
    } catch (whErr) {
      console.warn('Webhook dispatch failed:', whErr);
    }

    // 3. Owner email notification
    try {
      if (formSnapshot.receiveEmailNotifications !== false) {
        const admin = createAdminClient();
        const { data: userData } = await admin.auth.admin.getUserById(formSnapshot.userId!);
        const ownerEmail = userData?.user?.email;
        const ownerName =
          userData?.user?.user_metadata?.full_name ||
          userData?.user?.user_metadata?.username ||
          'User';

        if (ownerEmail) {
          const submissionSummary: Record<string, string> = {};
          for (const [key, val] of Object.entries(dbDataSnapshot)) {
            if (val !== null && val !== undefined) {
              submissionSummary[key] = String(val);
            }
          }
          const emailContent = getNewSubmissionEmail(
            ownerName,
            formSnapshot.title,
            submissionSummary,
            formSnapshot.googleSheetUrl
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

    // 4. Edit-link token + email
    try {
      const editCfg = formSnapshot.editLinkSettings;
      if (editCfg?.enabled) {
        const emailField =
          formSnapshot.fields.find((f) => f.id === editCfg.emailFieldId) ||
          formSnapshot.fields.find((f) => f.type === 'email');
        const emailValue = emailField
          ? String(dbDataSnapshot[emailField.label] ?? '').trim()
          : '';
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
        if (!emailField) {
          console.warn('Edit-link enabled but no email field found on the form.');
        } else if (!isEmail) {
          console.warn('Edit-link enabled but respondent email is empty/invalid.');
        } else {
          const { createEditToken } = await import('@/lib/storage/edit-tokens');
          const snapshot: Record<string, string> = {};
          for (const [k, v] of Object.entries(dbDataSnapshot)) {
            if (v !== null && v !== undefined) snapshot[k] = String(v);
          }
          const token = await createEditToken({
            formId: formSnapshot.id,
            userId: formSnapshot.userId!,
            submissionId,
            email: emailValue,
            snapshot,
            expiryDays: Math.max(1, Math.min(365, editCfg.expiryDays ?? 7)),
          });

          const editUrl = `${origin.replace(/\/$/, '')}/edit/${token}`;
          const { getEditLinkEmail } = await import('@/lib/email');
          const email = getEditLinkEmail(formSnapshot.title, editUrl, editCfg.expiryDays ?? 7);
          const sent = await sendEmail({
            to: emailValue,
            subject: email.subject,
            html: email.html,
          });
          if (!sent.success) {
            console.error('Edit-link email failed to send:', sent.error);
          }
        }
      }
    } catch (editErr) {
      console.error('Edit-link token / email failed:', editErr);
    }

    // 5. Respondent confirmation email
    try {
      const respCfg = formSnapshot.respondentNotification;
      if (respCfg?.enabled && respCfg.emailFieldId) {
        const emailField = formSnapshot.fields.find((f) => f.id === respCfg.emailFieldId);
        const emailValue = emailField
          ? String(dbDataSnapshot[emailField.label] ?? '').trim()
          : '';
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
        if (isEmail) {
          let summary: Record<string, string> | undefined;
          if (respCfg.includeSummary) {
            summary = {};
            for (const [k, v] of Object.entries(dbDataSnapshot)) {
              // Skip internal bookkeeping keys (e.g. _submission_id).
              if (k.startsWith('_')) continue;
              if (v !== null && v !== undefined) summary[k] = String(v);
            }
          }
          const { getRespondentConfirmationEmail } = await import('@/lib/email');
          const email = getRespondentConfirmationEmail(
            formSnapshot.title,
            respCfg.message,
            summary
          );
          await sendEmail({
            to: emailValue,
            subject: email.subject,
            html: email.html,
          });
        }
      }
    } catch (respErr) {
      console.warn('Respondent confirmation email failed:', respErr);
    }
  });

  return { success: true };
}
