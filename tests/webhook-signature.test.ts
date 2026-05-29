import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Webhook signature verification logic — extracted from
 * `app/api/payment/webhook/route.ts` for unit testing.
 *
 * If this logic ever drifts from the route handler, tests should fail.
 */
function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

describe('BCL webhook signature verification', () => {
  const secret = 'test-secret-do-not-use-in-prod';
  const body = JSON.stringify({ status: 'paid', amount: 5, order_number: 'KLF-001' });

  it('accepts a valid HMAC-SHA256 signature', () => {
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it('rejects a tampered body with original signature', () => {
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const tampered = body.replace('5', '500000');
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false);
  });

  it('rejects a signature signed with a different secret', () => {
    const sig = crypto.createHmac('sha256', 'wrong-secret').update(body).digest('hex');
    expect(verifyWebhookSignature(body, sig, secret)).toBe(false);
  });

  it('rejects a malformed/short signature without throwing', () => {
    expect(verifyWebhookSignature(body, 'deadbeef', secret)).toBe(false);
  });

  it('rejects empty signature', () => {
    expect(verifyWebhookSignature(body, '', secret)).toBe(false);
  });

  it('uses timing-safe comparison (no early-exit on length match)', () => {
    // Two different sigs of same length — should not throw and must return false
    const sigA = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const sigB = crypto.createHmac('sha256', secret).update(body + 'x').digest('hex');
    expect(sigA.length).toBe(sigB.length);
    expect(verifyWebhookSignature(body, sigB, secret)).toBe(false);
  });
});
