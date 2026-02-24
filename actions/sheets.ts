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
                    title: `${form.title} - Responses`,
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
