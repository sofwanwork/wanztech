import { NextRequest, NextResponse } from 'next/server';
import { listPendingSyncResponses, markResponseSynced, markResponseSyncFailed } from '@/lib/storage/form-responses';
import { appendToSheet } from '@/lib/api/google-sheets';
import { decrypt } from '@/lib/encryption';

/**
 * Vercel Cron: retries Google Sheets syncs for responses that were saved
 * locally but never made it to the Sheet (sheet_sync_status = 'pending').
 *
 * Runs every 10 minutes. Old failures age out via prune_form_responses;
 * rows stay 'pending' with a recorded error until they succeed.
 */

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

export async function GET(request: NextRequest) {
  // Verify cron secret (prevent unauthorized access)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const pending = await listPendingSyncResponses(50);

    for (const row of pending) {
      if (!row.googleSheetUrl) {
        // Form has no Sheet — permanent, stop retrying; local copy remains.
        await markResponseSyncFailed(row.submissionId, 'form has no google_sheet_url', {
          final: true,
        });
        continue;
      }

      const match = row.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        await markResponseSyncFailed(row.submissionId, 'invalid sheet url', { final: true });
        continue;
      }

      // Settings columns are stored encrypted — decrypt at the moment of use.
      const clientEmail = row.googleClientEmail ? decrypt(row.googleClientEmail) : undefined;
      const privateKey = row.googlePrivateKey ? formatPrivateKey(decrypt(row.googlePrivateKey)) : undefined;
      const refreshToken = row.googleRefreshToken ? decrypt(row.googleRefreshToken) : undefined;
      const accessTokenEnc = row.googleAccessToken ? decrypt(row.googleAccessToken) : undefined;

      // Refresh OAuth token if it's stale (magic links/retries run long after
      // the original submit).
      let accessToken = accessTokenEnc;
      if (accessToken && refreshToken && row.googleTokenExpiry) {
        if (Date.now() > row.googleTokenExpiry - 300000) {
          try {
            const { refreshAccessToken } = await import('@/lib/api/google-auth');
            const creds = await refreshAccessToken(refreshToken);
            if (creds.access_token) accessToken = creds.access_token;
          } catch {
            // fall through with the stale token — appendToSheet will surface it
          }
        }
      }

      if (!accessToken && !(clientEmail && privateKey)) {
        await markResponseSyncFailed(row.submissionId, 'missing google credentials', {
          final: true,
        });
        continue;
      }

      try {
        const result = await appendToSheet(
          {
            sheetId: match[1],
            clientEmail,
            privateKey,
            accessToken,
          },
          row.data
        );
        if (result.success) {
          await markResponseSynced(row.submissionId);
          synced++;
        } else {
          await markResponseSyncFailed(row.submissionId, result.error ?? 'unknown error');
          failed++;
          errors.push(`${row.submissionId}: ${result.error}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown error';
        await markResponseSyncFailed(row.submissionId, msg);
        failed++;
        errors.push(`${row.submissionId}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      pending: pending.length,
      synced,
      failed,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('[sync-responses cron] fatal:', error);
    // Security: never leak internals (String(error)) in the response.
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
