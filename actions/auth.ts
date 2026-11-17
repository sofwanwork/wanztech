'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { validateSignupInput } from '@/lib/auth/signup-guard';
import {
  isTurnstileServerVerificationEnabled,
  isTurnstileWidgetConfigured,
  verifyTurnstileToken,
} from '@/lib/auth/turnstile';

export interface SignUpActionInput {
  username: string;
  email: string;
  password: string;
  honeypot?: string;
  turnstileToken?: string;
}

export interface SignUpActionResult {
  success?: boolean;
  alreadyExists?: boolean;
  autoConfirmed?: boolean;
  error?: string;
}

export async function signUpAction(input: SignUpActionInput): Promise<SignUpActionResult> {
  const reqHeaders = await headers();
  const ip = getClientIP(reqHeaders);

  const rl = await checkRateLimit(ip, RATE_LIMITS.signupAttempt, 'auth-signup');
  if (!rl.success) {
    return {
      error: 'Too many registration attempts. Please wait a few minutes and try again.',
    };
  }

  const validation = validateSignupInput({
    username: input.username,
    email: input.email,
    password: input.password,
    honeypot: input.honeypot,
  });

  if (!validation.valid || !validation.normalizedEmail || !validation.normalizedUsername) {
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn('Signup bot detected by honeypot! IP:', ip);
    }
    return { error: validation.error || 'Invalid registration details.' };
  }

  const serverVerifyEnabled = isTurnstileServerVerificationEnabled();
  const widgetConfigured = isTurnstileWidgetConfigured();

  if (serverVerifyEnabled) {
    const verify = await verifyTurnstileToken({
      token: input.turnstileToken || '',
      expectedAction: 'signup',
      remoteIp: ip,
      requestHost: reqHeaders.get('x-forwarded-host') || reqHeaders.get('host'),
    });
    if (!verify.success) {
      return { error: verify.error || 'Human verification failed. Please try again.' };
    }
  } else if (widgetConfigured && !input.turnstileToken) {
    return { error: 'Please complete the human verification check.' };
  }

  const origin =
    reqHeaders.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://www.klikform.com';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validation.normalizedEmail,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Only forward captchaToken to Supabase when Next.js hasn't already redeemed it
      ...(!serverVerifyEnabled && input.turnstileToken
        ? { captchaToken: input.turnstileToken }
        : {}),
      data: {
        username: validation.normalizedUsername,
        full_name: validation.normalizedUsername,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user?.identities && data.user.identities.length === 0) {
    return { alreadyExists: true };
  }

  if (data?.session) {
    return { success: true, autoConfirmed: true };
  }

  return { success: true, autoConfirmed: false };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPasswordAction(email: string, captchaToken?: string) {
  const supabase = await createClient();

  const headersList = await import('next/headers');
  const origin =
    (await headersList.headers()).get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.klikform.com';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
    ...(captchaToken ? { captchaToken } : {}),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
