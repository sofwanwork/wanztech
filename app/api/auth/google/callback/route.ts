import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, oauth2Client } from '@/lib/api/google-auth';
import { createClient } from '@/utils/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings?error=oauth_error', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=missing_code', request.url));
    }

    try {
        // 1. Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        // 2. Get User
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // 3. Get User Email from Google (to display in UI)
        oauth2Client.setCredentials(tokens);
        const oauth2 = await import('googleapis').then((g) => g.google.oauth2({ version: 'v2', auth: oauth2Client }));
        const userInfo = await oauth2.userinfo.get();
        const userEmail = userInfo.data.email;

        // 4. Save tokens to DB
        const updateData = {
            user_id: user.id,
            google_access_token: tokens.access_token ? encrypt(tokens.access_token) : null,
            google_refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null, // Refresh token is only returned on first consent!
            google_token_expiry: tokens.expiry_date,
            // If we got an email, save it as "Client Email" for display consistency, 
            // or we can use a new field. For now, let's reuse google_client_email if empty, 
            // or just rely on the UI checking tokens.
            // But typically we want to show "Connected as..."
            // Let's UPDATE google_client_email so the UI shows it, 
            // even though it's technically a User Email not a Service Account Email.
            google_client_email: userEmail ? encrypt(userEmail) : undefined,
        };

        // Note: If refresh_token is missing (user re-authed without prompt='consent'), 
        // we should NOT overwrite the existing one with null.
        // However, our getAuthUrl forces prompt='consent', so we should get it.
        // But just in case:
        if (!tokens.refresh_token) {
            delete updateData.google_refresh_token;
        }

        const { error: dbError } = await supabase.from('settings').upsert(updateData, { onConflict: 'user_id' }); // Upsert by user_id
        // Note: upsert might require all non-null fields if row doesn't exist. 
        // But since we are likely updating, it should be fine. 
        // If it's a new row, user_id is enough.

        if (dbError) {
            console.error('Database save error:', dbError);
            return NextResponse.redirect(new URL('/settings?error=db_save_failed', request.url));
        }

        return NextResponse.redirect(new URL('/settings?success=google_connected', request.url));

    } catch (err) {
        console.error('OAuth Callback Error:', err);
        return NextResponse.redirect(new URL('/settings?error=oauth_callback_failed', request.url));
    }
}
