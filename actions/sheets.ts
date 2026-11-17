'use server';

import { getSettings, saveSettings } from '@/lib/storage/settings';
import { getFormById } from '@/lib/storage/forms';
import { createClient } from '@/utils/supabase/server';
import type { Settings } from '@/lib/types';

/**
 * Core helper that creates a Google Spreadsheet using either OAuth or Service Account credentials.
 * Automatically configures permissions (sharing with the user) and moves to folderId if configured.
 */
export async function createGoogleSpreadsheetHelper(
    title: string,
    settings: Settings,
    userEmail?: string
): Promise<{ success: boolean; url?: string; spreadsheetId?: string; error?: string }> {
    const cleanTitle = `${(title || 'Form').replace(/\r?\n/g, ' ').trim()} - Responses`;

    // 1. Try OAuth if accessToken or refreshToken is present
    if (settings.googleAccessToken || settings.googleRefreshToken) {
        let accessToken = settings.googleAccessToken;

        // Refresh token if expired or about to expire
        if (settings.googleRefreshToken && settings.googleTokenExpiry) {
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

                    await saveSettings({
                        ...settings,
                        googleAccessToken: credentials.access_token || settings.googleAccessToken,
                        googleTokenExpiry: credentials.expiry_date || settings.googleTokenExpiry,
                    });
                } catch (refreshErr) {
                    console.warn('[createGoogleSpreadsheetHelper] Token refresh failed:', refreshErr);
                }
            }
        }

        if (accessToken) {
            try {
                const { google } = await import('googleapis');
                const oauth2Client = new google.auth.OAuth2();
                oauth2Client.setCredentials({ access_token: accessToken });

                const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
                const response = await sheets.spreadsheets.create({
                    requestBody: {
                        properties: { title: cleanTitle },
                        sheets: [{ properties: { title: 'Responses' } }],
                    },
                });

                const spreadsheetId = response.data.spreadsheetId;
                if (spreadsheetId) {
                    if (settings.googleDriveFolderId) {
                        try {
                            const drive = google.drive({ version: 'v3', auth: oauth2Client });
                            await drive.files.update({
                                fileId: spreadsheetId,
                                addParents: settings.googleDriveFolderId,
                                fields: 'id, parents',
                            });
                        } catch (folderErr) {
                            console.warn('[createGoogleSpreadsheetHelper] Folder move failed (non-fatal):', folderErr);
                        }
                    }

                    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
                    return { success: true, url: sheetUrl, spreadsheetId };
                }
            } catch (oauthErr) {
                console.warn('[createGoogleSpreadsheetHelper] OAuth spreadsheet creation failed:', oauthErr);
            }
        }
    }

    // 2. Try Service Account if configured
    if (settings.googleClientEmail && settings.googlePrivateKey) {
        try {
            const { google } = await import('googleapis');
            const { JWT } = await import('google-auth-library');

            const formattedKey = (
                settings.googlePrivateKey.trim().startsWith('"') && settings.googlePrivateKey.trim().endsWith('"')
                    ? settings.googlePrivateKey.trim().slice(1, -1)
                    : settings.googlePrivateKey.trim()
            ).replace(/\\n/g, '\n');

            const auth = new JWT({
                email: settings.googleClientEmail,
                key: formattedKey,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive',
                ],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            const response = await sheets.spreadsheets.create({
                requestBody: {
                    properties: { title: cleanTitle },
                    sheets: [{ properties: { title: 'Responses' } }],
                },
            });

            const spreadsheetId = response.data.spreadsheetId;
            if (!spreadsheetId) {
                return { success: false, error: 'Failed to create spreadsheet with Service Account' };
            }

            const drive = google.drive({ version: 'v3', auth });

            // Share spreadsheet with user so they can view and edit it
            const targetEmail = settings.userPersonalEmail || userEmail;
            if (targetEmail) {
                try {
                    await drive.permissions.create({
                        fileId: spreadsheetId,
                        requestBody: {
                            role: 'writer',
                            type: 'user',
                            emailAddress: targetEmail,
                        },
                        sendNotificationEmail: false,
                    });
                } catch (shareErr) {
                    console.warn('[createGoogleSpreadsheetHelper] User share error, fallback to link:', shareErr);
                    try {
                        await drive.permissions.create({
                            fileId: spreadsheetId,
                            requestBody: {
                                role: 'writer',
                                type: 'anyone',
                            },
                        });
                    } catch (linkErr) {
                        console.warn('[createGoogleSpreadsheetHelper] Link share fallback error:', linkErr);
                    }
                }
            } else {
                try {
                    await drive.permissions.create({
                        fileId: spreadsheetId,
                        requestBody: {
                            role: 'writer',
                            type: 'anyone',
                        },
                    });
                } catch (linkErr) {
                    console.warn('[createGoogleSpreadsheetHelper] Link share fallback error:', linkErr);
                }
            }

            if (settings.googleDriveFolderId) {
                try {
                    await drive.files.update({
                        fileId: spreadsheetId,
                        addParents: settings.googleDriveFolderId,
                        fields: 'id, parents',
                    });
                } catch (folderErr) {
                    console.warn('[createGoogleSpreadsheetHelper] Folder move failed (non-fatal):', folderErr);
                }
            }

            const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
            return { success: true, url: sheetUrl, spreadsheetId };
        } catch (serviceErr) {
            console.error('[createGoogleSpreadsheetHelper] Service account create error:', serviceErr);
            return {
                success: false,
                error: serviceErr instanceof Error ? serviceErr.message : 'Failed to create Google Sheet with Service Account',
            };
        }
    }

    return {
        success: false,
        error: 'Google credentials not configured. Please connect Google in Settings.',
    };
}

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
    if (!settings) {
        return { success: false, error: 'Google not connected. Go to Settings to connect.' };
    }

    const result = await createGoogleSpreadsheetHelper(form.title || 'Form', settings, user.email);
    if (!result.success || !result.url) {
        return { success: false, error: result.error || 'Failed to create Google Sheet. Check your Google connection.' };
    }

    // Update form with the new Google Sheet URL
    await supabase
        .from('forms')
        .update({ google_sheet_url: result.url })
        .eq('id', formId)
        .eq('user_id', user.id);

    return { success: true, url: result.url };
}

/**
 * Updates the title of an existing Google Spreadsheet when the form title changes.
 */
export async function updateGoogleSpreadsheetTitle(
    sheetUrl: string,
    newTitle: string,
    settings: Settings
): Promise<{ success: boolean; error?: string }> {
    if (!sheetUrl) return { success: false, error: 'No sheet URL provided' };

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, error: 'Invalid Google Sheet URL' };
    }
    const spreadsheetId = match[1];

    const cleanTitle = `${(newTitle || 'Form').replace(/\r?\n/g, ' ').trim()} - Responses`;

    // 1. Try OAuth
    if (settings.googleAccessToken || settings.googleRefreshToken) {
        let accessToken = settings.googleAccessToken;

        // Refresh token if expired
        if (settings.googleRefreshToken && settings.googleTokenExpiry) {
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

                    await saveSettings({
                        ...settings,
                        googleAccessToken: credentials.access_token || settings.googleAccessToken,
                        googleTokenExpiry: credentials.expiry_date || settings.googleTokenExpiry,
                    });
                } catch (refreshErr) {
                    console.warn('[updateGoogleSpreadsheetTitle] OAuth token refresh failed:', refreshErr);
                }
            }
        }

        if (accessToken) {
            try {
                const { google } = await import('googleapis');
                const oauth2Client = new google.auth.OAuth2();
                oauth2Client.setCredentials({ access_token: accessToken });

                const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                updateSpreadsheetProperties: {
                                    properties: { title: cleanTitle },
                                    fields: 'title',
                                },
                            },
                        ],
                    },
                });

                return { success: true };
            } catch (oauthErr) {
                console.warn('[updateGoogleSpreadsheetTitle] OAuth rename failed, trying Service Account fallback if available:', oauthErr);
            }
        }
    }

    // 2. Try Service Account
    if (settings.googleClientEmail && settings.googlePrivateKey) {
        try {
            const { google } = await import('googleapis');
            const { JWT } = await import('google-auth-library');

            const formattedKey = (
                settings.googlePrivateKey.trim().startsWith('"') && settings.googlePrivateKey.trim().endsWith('"')
                    ? settings.googlePrivateKey.trim().slice(1, -1)
                    : settings.googlePrivateKey.trim()
            ).replace(/\\n/g, '\n');

            const auth = new JWT({
                email: settings.googleClientEmail,
                key: formattedKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            updateSpreadsheetProperties: {
                                properties: { title: cleanTitle },
                                fields: 'title',
                            },
                        },
                    ],
                },
            });

            return { success: true };
        } catch (saErr) {
            console.error('[updateGoogleSpreadsheetTitle] Service account rename failed:', saErr);
            return {
                success: false,
                error: saErr instanceof Error ? saErr.message : 'Failed to update Google Sheet title with Service Account',
            };
        }
    }

    return {
        success: false,
        error: 'No valid Google credentials configured',
    };
}

export async function syncSheetTitleAction(formId: string, newTitle: string) {
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
        return { success: false, error: 'Form has no linked Google Sheet' };
    }

    const settings = await getSettings();
    if (!settings) {
        return { success: false, error: 'No Google settings found' };
    }

    return await updateGoogleSpreadsheetTitle(form.googleSheetUrl, newTitle, settings);
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
        return { success: false, error: 'No Google Sheet connected to this form.' };
    }

    const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, error: 'Invalid Google Sheet URL.' };
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
        return { success: false, error: 'Google credentials not connected. Please connect in Settings.' };
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
