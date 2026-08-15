import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Local durable copy of form responses (`form_responses`).
 *
 * The Sheet-first architecture meant a failed `appendToSheet` lost the
 * response forever. Now submitFormAction writes here FIRST (fast, reliable,
 * same DB as everything else) and syncs to Google Sheets asynchronously
 * (after() + retry cron). The row's `sheet_sync_status` tracks the sync.
 */

export type SheetSyncStatus = 'pending' | 'synced' | 'failed';

export interface FormResponseRow {
  id: string;
  submissionId: string;
  formId: string;
  userId: string;
  data: Record<string, string>;
  sheetSyncStatus: SheetSyncStatus;
  sheetSyncError: string | null;
  sheetSyncedAt: string | null;
  createdAt: string;
}

interface DbRow {
  id: string;
  submission_id: string;
  form_id: string;
  user_id: string;
  data: unknown;
  sheet_sync_status: SheetSyncStatus;
  sheet_sync_error: string | null;
  sheet_synced_at: string | null;
  created_at: string;
}

function rowToResponse(row: DbRow): FormResponseRow {
  return {
    id: row.id,
    submissionId: row.submission_id,
    formId: row.form_id,
    userId: row.user_id,
    data: (row.data as Record<string, string>) ?? {},
    sheetSyncStatus: row.sheet_sync_status,
    sheetSyncError: row.sheet_sync_error,
    sheetSyncedAt: row.sheet_synced_at,
    createdAt: row.created_at,
  };
}

export type InsertResult = 'inserted' | 'duplicate' | 'error';

/**
 * Persist a submission locally.
 *
 *  - 'inserted'  : row created — proceed with the submission
 *  - 'duplicate' : a row with this submission_id already exists (respondent
 *                  double-clicked / double-sent). Caller should treat the
 *                  submission as ALREADY done and return success silently.
 *  - 'error'     : storage problem — nothing was saved, tell the respondent
 *                  to retry.
 */
export async function insertFormResponse(input: {
  submissionId: string;
  formId: string;
  userId: string;
  data: Record<string, string>;
}): Promise<InsertResult> {
  const admin = createAdminClient();
  const { error } = await admin.from('form_responses').insert({
    submission_id: input.submissionId,
    form_id: input.formId,
    user_id: input.userId,
    data: input.data,
    sheet_sync_status: 'pending',
  });
  if (error) {
    // Postgres unique-violation on submission_id → double submit, not a fault.
    if ((error as { code?: string }).code === '23505') {
      return 'duplicate';
    }
    console.error('[form-responses] insert error:', error);
    return 'error';
  }
  return 'inserted';
}

/**
 * Mark a submission as synced to Sheets.
 */
export async function markResponseSynced(submissionId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('form_responses')
    .update({
      sheet_sync_status: 'synced',
      sheet_sync_error: null,
      sheet_synced_at: new Date().toISOString(),
    })
    .eq('submission_id', submissionId);
  if (error) console.warn('[form-responses] markSynced error:', error);
}

/**
 * Record a sync failure. By default the row STAYS 'pending' so the retry
 * cron picks it up again; pass `final: true` for permanent failures (no
 * sheet URL, missing credentials) so it stops being retried while keeping
 * the error and the local copy for the owner.
 */
export async function markResponseSyncFailed(
  submissionId: string,
  error: string,
  opts?: { final?: boolean }
): Promise<void> {
  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    sheet_sync_error: error.slice(0, 500),
  };
  if (opts?.final) {
    update.sheet_sync_status = 'failed';
  }
  const { error: dbError } = await admin
    .from('form_responses')
    .update(update)
    .eq('submission_id', submissionId);
  if (dbError) console.warn('[form-responses] markFailed error:', dbError);
}

/**
 * Fetch responses still awaiting a Sheets sync (oldest first).
 * Used by the retry cron.
 */
export async function listPendingSyncResponses(limit = 50): Promise<
  Array<
    FormResponseRow & {
      googleSheetUrl: string | null;
      googleClientEmail: string | null;
      googlePrivateKey: string | null;
      googleAccessToken: string | null;
      googleRefreshToken: string | null;
      googleTokenExpiry: number | null;
      googleDriveFolderId: string | null;
    }
  >
> {
  const admin = createAdminClient();
  // Join the owner's settings + form sheet URL so the cron can sync without
  // N+1 queries.
  const { data, error } = await admin
    .from('form_responses')
    .select(
      `*,
       forms!inner ( google_sheet_url ),
       settings ( google_client_email, google_private_key, google_access_token,
                  google_refresh_token, google_token_expiry, google_drive_folder_id )`
    )
    .eq('sheet_sync_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    if (error) console.error('[form-responses] pending list error:', error);
    return [];
  }

  return data.map((raw: unknown) => {
    const row = raw as DbRow & {
      forms: { google_sheet_url: string | null };
      settings:
        | {
            google_client_email: string | null;
            google_private_key: string | null;
            google_access_token: string | null;
            google_refresh_token: string | null;
            google_token_expiry: number | null;
            google_drive_folder_id: string | null;
          }
        | Array<{
            google_client_email: string | null;
            google_private_key: string | null;
            google_access_token: string | null;
            google_refresh_token: string | null;
            google_token_expiry: number | null;
            google_drive_folder_id: string | null;
          }>
        | null;
    };
    const s = Array.isArray(row.settings) ? row.settings[0] : row.settings;
    return {
      ...rowToResponse(row),
      googleSheetUrl: row.forms?.google_sheet_url ?? null,
      googleClientEmail: s?.google_client_email ?? null,
      googlePrivateKey: s?.google_private_key ?? null,
      googleAccessToken: s?.google_access_token ?? null,
      googleRefreshToken: s?.google_refresh_token ?? null,
      googleTokenExpiry: s?.google_token_expiry ?? null,
      googleDriveFolderId: s?.google_drive_folder_id ?? null,
    };
  });
}

/**
 * Idempotency: has this exact submission already been stored?
 */
export async function responseExists(submissionId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('form_responses')
    .select('*', { count: 'exact', head: true })
    .eq('submission_id', submissionId);
  return (count ?? 0) > 0;
}
