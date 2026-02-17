import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  // Check for error params from Supabase (e.g. expired link, access denied)
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const errorCode = searchParams.get('error_code');

  function getRedirectUrl(path: string) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    if (isLocalEnv) {
      return `${origin}${path}`;
    } else if (forwardedHost) {
      return `https://${forwardedHost}${path}`;
    } else {
      return `${origin}${path}`;
    }
  }

  // If Supabase returned an error (e.g. expired link), redirect with a clear message
  if (error || errorCode) {
    const message = errorDescription || error || 'Authentication failed';
    return NextResponse.redirect(getRedirectUrl(`/login?error=${encodeURIComponent(message)}`));
  }

  const supabase = await createClient();

  // Handle token_hash flow (password recovery, email verification via token)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'email',
    });
    if (!error) {
      return NextResponse.redirect(getRedirectUrl(next));
    } else {
      console.error('Auth OTP Verification Error:', error);
      return NextResponse.redirect(getRedirectUrl(`/login?error=${encodeURIComponent(error.message)}`));
    }
  }

  // Handle code exchange flow (sign-up verification, OAuth)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getRedirectUrl(next));
    } else {
      console.error('Auth Code Exchange Error:', error);
      return NextResponse.redirect(getRedirectUrl(`/login?error=${encodeURIComponent(error.message)}`));
    }
  }

  return NextResponse.redirect(getRedirectUrl('/login?error=NoCodeProvided'));
}
