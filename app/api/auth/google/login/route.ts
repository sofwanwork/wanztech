import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/api/google-auth';
import crypto from 'crypto';

export async function GET() {
    // Generate a cryptographically secure random state token for CSRF protection.
    // This prevents an attacker from tricking the user into connecting
    // the attacker's Google account to klikform.
    const state = crypto.randomBytes(16).toString('hex');

    const url = getAuthUrl(state);
    const response = NextResponse.redirect(url);

    // Store state in a short-lived, HttpOnly, SameSite=Lax cookie.
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes — enough time for the OAuth roundtrip
        path: '/',
    });

    return response;
}
