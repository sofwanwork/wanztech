import { describe, it, expect } from 'vitest';
import {
  generateRotatingQrPayload,
  verifyRotatingQrToken,
  getCurrentTimeWindow,
} from '@/lib/forms/rotating-qr';

describe('Rotating QR Code — Time-Window Calculation', () => {
  it('calculates window index consistently for 30s intervals', () => {
    const t1 = 30000; // 30s
    const t2 = 45000; // 45s (same 30s bucket)
    const t3 = 60000; // 60s (next bucket)

    expect(getCurrentTimeWindow(30, t1)).toBe(1);
    expect(getCurrentTimeWindow(30, t2)).toBe(1);
    expect(getCurrentTimeWindow(30, t3)).toBe(2);
  });
});

describe('Rotating QR Code — Generation and Verification', () => {
  const formId = 'form-xyz-123';
  const baseUrl = 'https://www.klikform.com';
  const interval = 30;

  it('generates valid token and URL with query parameters', () => {
    const now = 1727520000000; // Fixed timestamp
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: interval,
      timestampMs: now,
    });

    expect(payload.url).toContain(`/form/${formId}?rq_w=`);
    expect(payload.url).toContain('&rq_sig=');
    expect(payload.windowIndex).toBe(Math.floor(now / 1000 / interval));
    expect(payload.signature).toHaveLength(16);
    expect(payload.expiresInSeconds).toBeGreaterThan(0);
    expect(payload.expiresInSeconds).toBeLessThanOrEqual(interval);
  });

  it('successfully verifies a token in the current window', () => {
    const now = 1727520010000;
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: interval,
      timestampMs: now,
    });

    const result = verifyRotatingQrToken({
      formId,
      windowIndex: payload.windowIndex,
      signature: payload.signature,
      intervalSeconds: interval,
      nowMs: now,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBe('valid');
  });

  it('allows previous window within grace period (e.g. scanned at second 29)', () => {
    const generatedTime = 1727520025000; // Window W
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: interval,
      timestampMs: generatedTime,
    });

    // 10 seconds later (in Window W + 1)
    const scannedTime = 1727520035000;
    const result = verifyRotatingQrToken({
      formId,
      windowIndex: payload.windowIndex,
      signature: payload.signature,
      intervalSeconds: interval,
      nowMs: scannedTime,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBe('valid');
  });

  it('rejects an expired token from 2 windows ago (e.g. photo taken earlier in the morning)', () => {
    const morningTime = 1727520000000; // 08:30 AM
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: interval,
      timestampMs: morningTime,
    });

    // Evening: 8 hours later (or just 2 minutes later)
    const eveningTime = morningTime + 120000; // 2 minutes later (4 windows ago)
    const result = verifyRotatingQrToken({
      formId,
      windowIndex: payload.windowIndex,
      signature: payload.signature,
      intervalSeconds: interval,
      nowMs: eveningTime,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('expired');
  });

  it('rejects an invalid/tampered signature', () => {
    const now = 1727520000000;
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: interval,
      timestampMs: now,
    });

    const result = verifyRotatingQrToken({
      formId,
      windowIndex: payload.windowIndex,
      signature: 'fake_tampered_sig',
      intervalSeconds: interval,
      nowMs: now,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid_signature');
  });

  it('rejects when token parameters are missing', () => {
    const result = verifyRotatingQrToken({
      formId,
      windowIndex: null,
      signature: undefined,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing');
  });
});
