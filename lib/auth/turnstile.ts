import 'server-only';

interface TurnstileVerifyParams {
  token: string;
  expectedAction: string;
  remoteIp?: string;
  requestHost?: string | null;
}

interface TurnstileVerifyResponse {
  success: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
}

export function getTurnstileSecretKey(): string {
  return (process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET || '').trim();
}

export function isTurnstileServerVerificationEnabled(): boolean {
  return getTurnstileSecretKey().length > 0;
}

export function isTurnstileWidgetConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

/**
 * Verify a Cloudflare Turnstile response token against Cloudflare Siteverify.
 * Fails closed on missing secret, invalid/empty token, network errors, action mismatch, or hostname mismatch.
 */
export async function verifyTurnstileToken({
  token,
  expectedAction,
  remoteIp,
  requestHost,
}: TurnstileVerifyParams): Promise<TurnstileVerificationResult> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return { success: false, error: 'Turnstile verification is not configured on the server.' };
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { success: false, error: 'Please complete the human verification check.' };
  }

  const configuredHostnames = (process.env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const normalizedRequestHost = requestHost
    ? requestHost.split(':')[0].trim().toLowerCase()
    : '';

  const allowedHostnames = new Set(
    configuredHostnames.length > 0
      ? configuredHostnames
      : normalizedRequestHost
        ? [normalizedRequestHost]
        : []
  );

  if (allowedHostnames.size === 0) {
    return { success: false, error: 'Unable to verify request origin hostname.' };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp && remoteIp !== 'unknown') {
      body.set('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body,
    });

    if (!res.ok) {
      return { success: false, error: 'Verification service temporarily unavailable.' };
    }

    const data = (await res.json()) as TurnstileVerifyResponse;
    const returnedHostname = (data.hostname || '').trim().toLowerCase();

    if (
      data.success !== true ||
      (data.action && data.action !== expectedAction) ||
      !allowedHostnames.has(returnedHostname)
    ) {
      return { success: false, error: 'Verification failed. Please try again.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Verification request timed out. Please try again.' };
  }
}
