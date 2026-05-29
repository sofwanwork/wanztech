/**
 * Outgoing webhook dispatcher.
 *
 * Sign + POST + retry. Pure helpers (`signPayload`, `verifySignature`) are
 * exported for unit tests. The `dispatch()` entry point is fire-and-forget
 * from the form-submission server action — webhook failures must never block
 * the submission.
 *
 * Signing scheme matches the inbound BCL webhook verifier in
 * `app/api/payment/webhook/route.ts`:
 *   - HMAC-SHA256 over the raw JSON body
 *   - Hex digest
 *   - Header: `x-klikform-signature`
 */

import crypto from 'crypto';
import type { WebhookSubmissionPayload } from '@/lib/types/webhooks';

export const SIGNATURE_HEADER = 'x-klikform-signature';

/**
 * Compute the HMAC-SHA256 hex digest of `body` using `secret`.
 * Exported separately so the unit test can re-implement the verifier.
 */
export function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Timing-safe verifier — provided so receivers can copy-paste this and
 * sanity-checked against the test suite.
 */
export function verifySignature(body: string, secret: string, signature: string): boolean {
  const expected = signPayload(body, secret);
  let exp: Buffer;
  let sig: Buffer;
  try {
    exp = Buffer.from(expected, 'hex');
    sig = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  if (exp.length !== sig.length) return false;
  return crypto.timingSafeEqual(exp, sig);
}

interface DispatchOptions {
  url: string;
  secret: string;
  payload: WebhookSubmissionPayload;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Max attempts including the first. Defaults to 3. */
  maxAttempts?: number;
  /** Exponential backoff base — `delay = base * 2^attempt`. */
  backoffMs?: number;
  /** Optional injected fetch (tests). */
  fetchImpl?: typeof fetch;
  /** Optional sleeper (tests). */
  sleepImpl?: (ms: number) => Promise<void>;
}

export interface DispatchResult {
  ok: boolean;
  status: number | null;
  error?: string;
  attempts: number;
}

const defaultSleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send the webhook, retrying on network errors and 5xx responses.
 * 4xx responses short-circuit (the receiver's intent — don't keep banging).
 */
export async function dispatchWebhook(opts: DispatchOptions): Promise<DispatchResult> {
  const {
    url,
    secret,
    payload,
    timeoutMs = 5_000,
    maxAttempts = 3,
    backoffMs = 500,
    fetchImpl = fetch,
    sleepImpl = defaultSleep,
  } = opts;

  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  let lastStatus: number | null = null;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'KlikForm-Webhook/1.0',
          [SIGNATURE_HEADER]: signature,
          'x-klikform-event': payload.event,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      lastStatus = res.status;

      if (res.ok) {
        return { ok: true, status: res.status, attempts: attempt };
      }
      // 4xx: don't retry — receiver explicitly rejected
      if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          error: `Receiver returned ${res.status}`,
          attempts: attempt,
        };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : 'Network error';
    }

    if (attempt < maxAttempts) {
      await sleepImpl(backoffMs * 2 ** (attempt - 1));
    }
  }

  return {
    ok: false,
    status: lastStatus,
    error: lastError ?? 'Dispatch failed',
    attempts: maxAttempts,
  };
}
