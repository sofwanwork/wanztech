'use server';

import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { encrypt } from '@/lib/encryption';
import { readSheetRows } from '@/lib/api/google-sheets';
import { aggregateResponses, type ResponseFieldSummary } from '@/lib/analytics/responses';

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

export interface ResponseSummaryResult {
  ok: boolean;
  summaries?: ResponseFieldSummary[];
  totalResponses?: number;
  error?: string;
}

/**
 * Owner-only: read the form's Google Sheet and aggregate answer distributions
 * for chartable fields (select/radio/checkbox/rating).
 */
export async function getFormResponseSummary(formId: string): Promise<ResponseSummaryResult> {
  // --- Ownership check ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized' };

  const form = await getFormById(formId);
  if (!form) return { ok: false, error: 'Form not found' };
  if (form.userId !== user.id) return { ok: false, error: 'Unauthorized' };

  if (!form.googleSheetUrl) {
    return { ok: false, error: 'Borang ini tiada Google Sheet yang disambung.' };
  }
  const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) return { ok: false, error: 'URL Google Sheet tidak sah.' };
  const sheetId = match[1];

  const settings = await getSettingsByFormId(formId);
  if (!settings) return { ok: false, error: 'Tiada konfigurasi Google dijumpai.' };

  // --- Resolve auth: OAuth (with refresh) or Service Account ---
  let accessToken = settings.googleAccessToken;
  if (accessToken && settings.googleRefreshToken && settings.googleTokenExpiry) {
    if (Date.now() > settings.googleTokenExpiry - 300000) {
      try {
        const { refreshAccessToken } = await import('@/lib/api/google-auth');
        const newCreds = await refreshAccessToken(settings.googleRefreshToken);
        if (newCreds.access_token) {
          accessToken = newCreds.access_token;
          const admin = createAdminClient();
          const updateData: Record<string, unknown> = {
            google_access_token: encrypt(accessToken),
            updated_at: new Date().toISOString(),
          };
          if (newCreds.expiry_date) updateData.google_token_expiry = newCreds.expiry_date;
          await admin.from('settings').update(updateData).eq('user_id', user.id);
        }
      } catch (e) {
        console.error('Token refresh failed (response summary):', e);
      }
    }
  }

  const result = await readSheetRows({
    sheetId,
    accessToken,
    clientEmail: settings.googleClientEmail?.trim(),
    privateKey: settings.googlePrivateKey
      ? formatPrivateKey(settings.googlePrivateKey)
      : undefined,
  });

  if (!result.success || !result.rows) {
    return { ok: false, error: result.error || 'Gagal membaca Google Sheet.' };
  }

  const summaries = aggregateResponses(result.rows, form.fields);
  return { ok: true, summaries, totalResponses: result.rows.length };
}
