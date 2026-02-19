import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file', // Create/Edit files created by this app
    'https://www.googleapis.com/auth/spreadsheets', // Manage spreadsheets
    'https://www.googleapis.com/auth/userinfo.email', // Identify user
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
