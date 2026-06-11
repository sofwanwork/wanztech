import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback';

// OAuth scopes requested on "Connect with Google". Kept to the minimum the
// product needs — all are Google "sensitive" tier (lighter verification),
// none are "restricted" (which would require an annual security assessment):
//   - drive.file        : create/edit only the files this app makes (e.g.
//                          uploaded form attachments, auto-created Sheets).
//                          This is the most privacy-preserving Drive scope.
//   - spreadsheets       : read/write the response Google Sheet (needed when a
//                          user connects an EXISTING sheet, not app-created).
//   - userinfo.email     : identify the connected account in the UI.
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
];

export const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export function getAuthUrl(state?: string) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for refresh token
        scope: SCOPES,
        prompt: 'consent', // Force consent to ensure refresh token is returned
        ...(state ? { state } : {}),
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

/**
 * Resolve a usable Google access token. Google OAuth access tokens live ~1h,
 * so any flow that runs long after "Connect with Google" (e.g. a respondent
 * opening a magic edit link) must refresh before calling Sheets/Drive, or it
 * gets a 401. Refreshes when expiring within 5 minutes and persists the new
 * token to the owner's settings row. Returns the (possibly refreshed) token,
 * or the original when no refresh is needed/possible.
 */
export async function getValidAccessToken(params: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: number;
    userId?: string;
}): Promise<string | undefined> {
    let accessToken = params.accessToken;
    const { refreshToken, tokenExpiry, userId } = params;

    if (accessToken && refreshToken && tokenExpiry) {
        // 5-minute safety window before actual expiry.
        if (Date.now() > tokenExpiry - 300000) {
            try {
                const newCreds = await refreshAccessToken(refreshToken);
                if (newCreds.access_token) {
                    accessToken = newCreds.access_token;
                    const { createAdminClient } = await import('@/utils/supabase/admin');
                    const { encrypt } = await import('@/lib/encryption');
                    const updateData: Record<string, unknown> = {
                        google_access_token: encrypt(accessToken),
                        updated_at: new Date().toISOString(),
                    };
                    if (newCreds.expiry_date) {
                        updateData.google_token_expiry = newCreds.expiry_date;
                    }
                    if (userId) {
                        const admin = createAdminClient();
                        await admin.from('settings').update(updateData).eq('user_id', userId);
                    }
                }
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
        }
    }

    return accessToken;
}
