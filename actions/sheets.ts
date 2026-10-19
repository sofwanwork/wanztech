'use server';

import { getSettings, saveSettings } from '@/lib/storage/settings';
import { getFormById } from '@/lib/storage/forms';
import { createClient } from '@/utils/supabase/server';

export async function createSheetForFormAction(formId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const form = await getFormById(formId);
    if (!form || form.userId !== user.id) {
        return { success: false, error: 'Form not found or unauthorized' };
    }

    if (form.googleSheetUrl) {
        return { success: false, error: 'Form already has a Google Sheet linked' };
    }

    const settings = await getSettings();
    let accessToken = settings?.googleAccessToken;

    if (!accessToken) {
        return { success: false, error: 'Google not connected. Go to Settings to connect.' };
    }

    // Refresh token if expired
    if (settings?.googleRefreshToken && settings?.googleTokenExpiry) {
        if (Date.now() > settings.googleTokenExpiry - 300000) {
            try {
                const { google } = await import('googleapis');
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );
                oauth2Client.setCredentials({ refresh_token: settings.googleRefreshToken });
                const { credentials } = await oauth2Client.refreshAccessToken();
                accessToken = credentials.access_token || accessToken;

                // Save refreshed token
                await saveSettings({
                    ...settings,
                    googleAccessToken: credentials.access_token || settings.googleAccessToken,
                    googleTokenExpiry: credentials.expiry_date || settings.googleTokenExpiry,
                });
            } catch {
                return { success: false, error: 'Failed to refresh Google token. Reconnect in Settings.' };
            }
        }
    }

    try {
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

        // Create new spreadsheet
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `${(form.title || 'Form').replace(/\r?\n/g, ' ').trim()} - Responses`,
                },
                sheets: [
                    {
                        properties: {
                            title: 'Responses',
                        },
                    },
                ],
            },
        });

        const spreadsheetId = response.data.spreadsheetId;
        if (!spreadsheetId) {
            return { success: false, error: 'Failed to create spreadsheet' };
        }

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

        // Update form with the new Google Sheet URL
        await supabase
            .from('forms')
            .update({ google_sheet_url: sheetUrl })
            .eq('id', formId)
            .eq('user_id', user.id);

        return { success: true, url: sheetUrl };
    } catch (error) {
        console.error('Create Sheet Error:', error);
        return { success: false, error: 'Failed to create Google Sheet. Check your Google connection.' };
    }
}

/**
 * Manually trigger a retry sync for any pending form responses that failed
 * to sync to Google Sheets (e.g. previously blocked by sheet column limit or temporary network outage).
 */
export async function syncPendingResponsesForFormAction(formId: string): Promise<{
    success: boolean;
    syncedCount?: number;
    failedCount?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const form = await getFormById(formId);
    if (!form || form.userId !== user.id) {
        return { success: false, error: 'Form not found or unauthorized' };
    }

    if (!form.googleSheetUrl) {
        return { success: false, error: 'Tiada Google Sheet disambungkan ke borang ini.' };
    }

    const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, error: 'Pautan Google Sheet tidak sah.' };
    }
    const sheetId = match[1];

    const settings = await getSettings();
    let accessToken = settings?.googleAccessToken;

    // Refresh token if expired
    if (settings?.googleRefreshToken && settings?.googleTokenExpiry) {
        if (Date.now() > settings.googleTokenExpiry - 300000) {
            try {
                const { refreshAccessToken } = await import('@/lib/api/google-auth');
                const creds = await refreshAccessToken(settings.googleRefreshToken);
                if (creds.access_token) {
                    accessToken = creds.access_token;
                    await saveSettings({
                        ...settings,
                        googleAccessToken: accessToken,
                        googleTokenExpiry: creds.expiry_date || settings.googleTokenExpiry,
                    });
                }
            } catch (err) {
                console.warn('[syncPendingResponses] Token refresh error:', err);
            }
        }
    }

    const clientEmail = settings?.googleClientEmail;
    const privateKey = settings?.googlePrivateKey
        ? (settings.googlePrivateKey.trim().startsWith('"') && settings.googlePrivateKey.trim().endsWith('"')
            ? settings.googlePrivateKey.trim().slice(1, -1)
            : settings.googlePrivateKey.trim()
          ).replace(/\\n/g, '\n')
        : undefined;

    if (!accessToken && !(clientEmail && privateKey)) {
        return { success: false, error: 'Kredensial Google belum disambungkan. Sila sambung di Tetapan.' };
    }

    const { createAdminClient } = await import('@/utils/supabase/admin');
    const admin = createAdminClient();
    const { data: pendingRows, error: fetchErr } = await admin
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .eq('sheet_sync_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(100);

    if (fetchErr) {
        return { success: false, error: fetchErr.message };
    }

    if (!pendingRows || pendingRows.length === 0) {
        return { success: true, syncedCount: 0, failedCount: 0 };
    }

    const { appendToSheet } = await import('@/lib/api/google-sheets');
    const { markResponseSynced, markResponseSyncFailed } = await import('@/lib/storage/form-responses');

    let syncedCount = 0;
    let failedCount = 0;

    for (const row of pendingRows) {
        try {
            const result = await appendToSheet(
                {
                    sheetId,
                    clientEmail,
                    privateKey,
                    accessToken,
                },
                row.data as Record<string, string | number | boolean | null | undefined>
            );

            if (result.success) {
                await markResponseSynced(row.submission_id);
                syncedCount++;
            } else {
                await markResponseSyncFailed(row.submission_id, result.error ?? 'unknown error');
                failedCount++;
            }
        } catch (rowErr) {
            await markResponseSyncFailed(
                row.submission_id,
                rowErr instanceof Error ? rowErr.message : 'unknown error'
            );
            failedCount++;
        }
    }

    return {
        success: true,
        syncedCount,
        failedCount,
    };
}
