import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/forms';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        // Auth error
        console.error('Callback error:', error.message);
        const errMessage = encodeURIComponent(error.message || 'Authentication failed');
        return NextResponse.redirect(`${origin}/login?error=${errMessage}`);
    }

    // Handle error parameters passed by Supabase (like access_denied)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
        const errMessage = encodeURIComponent(errorDescription || error);
        return NextResponse.redirect(`${origin}/login?error=${errMessage}`);
    }

    // Fallback
    return NextResponse.redirect(`${origin}/login?error=InvalidAuthRequest`);
}
