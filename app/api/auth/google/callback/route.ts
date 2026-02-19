import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, oauth2Client } from '@/lib/api/google-auth';
import { createClient } from '@/utils/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const returnedState = searchParams.get('state');

    if (error) {
        return NextResponse.redirect(new URL('/settings?error=oauth_error', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=missing_code', request.url));
    }

    // Security: Validate state parameter to prevent OAuth CSRF attacks.
    // The state value Google returns must match what we stored in the cookie.
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || !returnedState || storedState !== returnedState) {
        console.warn('OAuth CSRF check failed: state mismatch or missing');
        return NextResponse.redirect(new URL('/settings?error=oauth_csrf_failed', request.url));
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
        const updateData: any = {
            user_id: user.id,
            google_access_token: tokens.access_token ? encrypt(tokens.access_token) : null,
            google_token_expiry: tokens.expiry_date,
            google_client_email: userEmail ? encrypt(userEmail) : undefined,
        };

        // Only update refresh token if we got a new one!
        if (tokens.refresh_token) {
            updateData.google_refresh_token = encrypt(tokens.refresh_token);
        }

        const { error: dbError } = await supabase.from('settings').upsert(updateData, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Database save error:', dbError);
            return NextResponse.redirect(new URL('/settings?error=db_save_failed', request.url));
        }

        // 5. Clear the used state cookie
        const successResponse = NextResponse.redirect(new URL('/settings?success=google_connected', request.url));
        successResponse.cookies.delete('oauth_state');
        return successResponse;

    } catch (err) {
        console.error('OAuth Callback Error:', err);
        return NextResponse.redirect(new URL('/settings?error=oauth_callback_failed', request.url));
    }
}
