import crypto from 'crypto';

export const DEFAULT_ROTATING_INTERVAL_SECONDS = 30;

/**
 * Get secret salt for HMAC generation.
 */
export function getRotatingQrSecret(formId: string, customSecret?: string): string {
  const globalSalt = process.env.ROTATING_QR_SECRET || 'klikform-rotating-salt-2026';
  return customSecret ? `${customSecret}:${globalSalt}` : `${formId}:${globalSalt}`;
}

/**
 * Get current time-window index based on interval (default 30 seconds).
 */
export function getCurrentTimeWindow(
  intervalSeconds = DEFAULT_ROTATING_INTERVAL_SECONDS,
  timestampMs = Date.now()
): number {
  const safeInterval = Math.max(5, intervalSeconds);
  return Math.floor(timestampMs / 1000 / safeInterval);
}

/**
 * Generate HMAC signature for a specific time window.
 */
export function generateRotatingQrSignature(
  formId: string,
  windowIndex: number,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${formId}:${windowIndex}`)
    .digest('hex')
    .slice(0, 16);
}

export interface RotatingQrPayload {
  url: string;
  windowIndex: number;
  signature: string;
  expiresInSeconds: number;
}

/**
 * Generate full URL and token parameters for live rotating QR code.
 */
export function generateRotatingQrPayload(
  baseUrl: string,
  formId: string,
  options?: {
    intervalSeconds?: number;
    secret?: string;
    timestampMs?: number;
  }
): RotatingQrPayload {
  const interval = options?.intervalSeconds || DEFAULT_ROTATING_INTERVAL_SECONDS;
  const now = options?.timestampMs || Date.now();
  const windowIndex = getCurrentTimeWindow(interval, now);
  const secret = getRotatingQrSecret(formId, options?.secret);
  const signature = generateRotatingQrSignature(formId, windowIndex, secret);

  // Time remaining in current window
  const windowStartMs = windowIndex * interval * 1000;
  const elapsedMs = now - windowStartMs;
  const expiresInSeconds = Math.max(1, Math.ceil((interval * 1000 - elapsedMs) / 1000));

  // Build clean URL with parameters
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/form/${formId}?rq_w=${windowIndex}&rq_sig=${signature}`;

  return {
    url,
    windowIndex,
    signature,
    expiresInSeconds,
  };
}

export type RotatingQrVerifyReason =
  | 'valid'
  | 'missing'
  | 'invalid_signature'
  | 'expired'
  | 'future';

export interface VerifyResult {
  valid: boolean;
  reason: RotatingQrVerifyReason;
}

/**
 * Verify incoming rotating QR token from URL query parameters.
 * Allows current window and previous window (grace period of 1 window)
 * to ensure participants who scan near the window boundary aren't rejected.
 */
export function verifyRotatingQrToken(input: {
  formId: string;
  windowIndex?: number | string | null;
  signature?: string | null;
  customSecret?: string;
  intervalSeconds?: number;
  nowMs?: number;
}): VerifyResult {
  const { formId, windowIndex, signature, customSecret, intervalSeconds, nowMs } = input;

  if (windowIndex === undefined || windowIndex === null || !signature) {
    return { valid: false, reason: 'missing' };
  }

  const wNum = typeof windowIndex === 'string' ? parseInt(windowIndex, 10) : windowIndex;
  if (isNaN(wNum)) {
    return { valid: false, reason: 'missing' };
  }

  const interval = intervalSeconds || DEFAULT_ROTATING_INTERVAL_SECONDS;
  const now = nowMs || Date.now();
  const currentWindow = getCurrentTimeWindow(interval, now);
  const secret = getRotatingQrSecret(formId, customSecret);

  // Compute expected signature for this specific window
  const expectedSig = generateRotatingQrSignature(formId, wNum, secret);

  const sigBuf = Buffer.from(String(signature));
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  // Window expiry check:
  // Allow current window (wNum === currentWindow)
  // and previous window (wNum === currentWindow - 1) as grace period
  if (wNum < currentWindow - 1) {
    return { valid: false, reason: 'expired' };
  }

  if (wNum > currentWindow + 1) {
    return { valid: false, reason: 'future' };
  }

  return { valid: true, reason: 'valid' };
}
