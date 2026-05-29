'use server';

import { headers as getNextHeaders } from 'next/headers';
import { getEditToken, markEditTokenUsed } from '@/lib/storage/edit-tokens';
import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';
import { updateSheetRow } from '@/lib/api/google-sheets';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeHtml } from '@/lib/utils';

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

/**
 * Look up an edit token and (if valid) return the form schema + a snapshot
 * of the original answers so the public form client can render itself in
 * edit mode.
 */
export async function loadEditableResponse(token: string): Promise<
  | {
      ok: true;
      formId: string;
      // We return the raw form via getFormById downstream — caller fetches.
      snapshot: Record<string, string>;
    }
  | { ok: false; error: 'not_found' | 'used' | 'expired' }
> {
  const lookup = await getEditToken(token);
  if (!lookup.valid) {
    return { ok: false, error: lookup.reason };
  }
  return {
    ok: true,
    formId: lookup.row.formId,
    snapshot: lookup.row.snapshot,
  };
}

/**
 * Re-submit a single response, identified by the edit token. Mirrors the
 * validation rules of `submitFormAction` but updates the existing Google
 * Sheet row in place and marks the token as used.
 *
 * Out of scope (intentionally): file uploads (would orphan the previous
 * file), webhooks (no "edit" event yet), email notification to owner. Edits
 * are deliberately quieter than new submissions.
 */
export async function submitEditedResponseAction(
  token: string,
  formDataObj: FormData | Record<string, string | number | boolean>
): Promise<{ success: boolean; error?: string }> {
  // Rate-limit the edit endpoint same as submission.
  const headersList = await getNextHeaders();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'edit-response');
  if (!rl.success) {
    return { success: false, error: 'Terlalu banyak percubaan. Sila cuba lagi.' };
  }

  const lookup = await getEditToken(token);
  if (!lookup.valid) {
    if (lookup.reason === 'expired') {
      return { success: false, error: 'Pautan ini telah luput.' };
    }
    if (lookup.reason === 'used') {
      return { success: false, error: 'Pautan ini telah digunakan.' };
    }
    return { success: false, error: 'Pautan tidak sah.' };
  }
  const tokenRow = lookup.row;

  const form = await getFormById(tokenRow.formId);
  if (!form) return { success: false, error: 'Form tidak dijumpai.' };

  // Materialize input
  const inputData: Record<string, unknown> = {};
  if (formDataObj instanceof FormData) {
    for (const [key, value] of Array.from(formDataObj.entries())) {
      // Edit mode skips file uploads — silently drop File entries so we
      // keep the original Drive link.
      if (value instanceof File) continue;
      inputData[key] = value;
    }
  } else {
    Object.assign(inputData, formDataObj);
  }

  // Reuse the same "required + minLength + maxLength + pattern" validation
  // as the new-submission path (without conditional skipping).
  for (const field of form.fields) {
    const value = inputData[field.label] ?? inputData[field.id];
    if (field.required && !value && value !== 0 && value !== false) {
      return { success: false, error: `${field.label} is required.` };
    }
    if (typeof value === 'string') {
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return { success: false, error: `${field.label} is too short.` };
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return { success: false, error: `${field.label} is too long.` };
      }
      if (field.validation?.pattern) {
        try {
          const MAX = 1000;
          const test = value.length > MAX ? value.slice(0, MAX) : value;
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(test)) {
            return { success: false, error: `${field.label} format is invalid.` };
          }
        } catch {
          /* ignore invalid regex */
        }
      }
    }
  }

  // Sanitize rich-text-ish inputs the same way submitFormAction would.
  const dbData: Record<string, string | number | boolean | null | undefined> = {};
  for (const [k, v] of Object.entries(inputData)) {
    if (typeof v === 'string') {
      dbData[k] = sanitizeHtml(v);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      dbData[k] = v;
    } else if (v != null) {
      dbData[k] = String(v);
    }
  }

  // Carry over the submission id so we update the same row.
  dbData._submission_id = tokenRow.submissionId;

  if (!form.googleSheetUrl) {
    return { success: false, error: 'Form ini tidak disambung ke Google Sheet.' };
  }

  const settings = await getSettingsByFormId(form.id);
  if (!settings) {
    return { success: false, error: 'Konfigurasi tidak dijumpai.' };
  }

  const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return { success: false, error: 'Google Sheet URL tidak sah.' };
  }
  const sheetId = match[1];
  const pk = settings.googlePrivateKey ? formatPrivateKey(settings.googlePrivateKey) : undefined;

  const result = await updateSheetRow(
    {
      sheetId,
      clientEmail: settings.googleClientEmail,
      privateKey: pk,
      accessToken: settings.googleAccessToken,
    },
    '_submission_id',
    tokenRow.submissionId,
    dbData
  );

  if (!result.success) {
    return { success: false, error: result.error ?? 'Gagal mengemas kini Google Sheet.' };
  }

  // Mark token used (single-use semantics).
  await markEditTokenUsed(tokenRow.id);

  return { success: true };
}
