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

  it('supports custom interval durations (e.g. 60s, 120s)', () => {
    const customIntervals = [15, 60, 90, 120];
    const now = 1727520000000;

    for (const customInt of customIntervals) {
      const payload = generateRotatingQrPayload(baseUrl, formId, {
        intervalSeconds: customInt,
        timestampMs: now,
      });

      expect(payload.expiresInSeconds).toBeLessThanOrEqual(customInt);

      // Verify token with same custom interval
      const res = verifyRotatingQrToken({
        formId,
        windowIndex: payload.windowIndex,
        signature: payload.signature,
        intervalSeconds: customInt,
        nowMs: now,
      });

      expect(res.valid).toBe(true);
      expect(res.reason).toBe('valid');

      // Reject when tested far beyond the custom window (3 windows later)
      const futureExpired = now + customInt * 3 * 1000;
      const expiredRes = verifyRotatingQrToken({
        formId,
        windowIndex: payload.windowIndex,
        signature: payload.signature,
        intervalSeconds: customInt,
        nowMs: futureExpired,
      });

      expect(expiredRes.valid).toBe(false);
      expect(expiredRes.reason).toBe('expired');
    }
  });

  it('rejects page-load when query parameters are completely missing', () => {
    const res = verifyRotatingQrToken({
      formId,
      windowIndex: undefined,
      signature: undefined,
    });

    expect(res.valid).toBe(false);
    expect(res.reason).toBe('missing');
  });

  it('rejects page-load when user bookmarks or reloads stale URL after 3 minutes', () => {
    const originalTime = 1727520000000;
    const payload = generateRotatingQrPayload(baseUrl, formId, {
      intervalSeconds: 30,
      timestampMs: originalTime,
    });

    // 3 minutes (180 seconds = 6 windows) later
    const reloadTime = originalTime + 180000;
    const res = verifyRotatingQrToken({
      formId,
      windowIndex: payload.windowIndex,
      signature: payload.signature,
      intervalSeconds: 30,
      nowMs: reloadTime,
    });

    expect(res.valid).toBe(false);
    expect(res.reason).toBe('expired');
  });

  it('correctly decides whether "Submit another response" should be hidden', () => {
    const shouldShowSubmitAnother = (opts: {
      allowMultipleSubmissions?: boolean;
      isCheckIn?: boolean;
      isCheckOut?: boolean;
      isRotatingQr?: boolean;
    }) => {
      const {
        allowMultipleSubmissions = true,
        isCheckIn = false,
        isCheckOut = false,
        isRotatingQr = false,
      } = opts;

      return (
        allowMultipleSubmissions &&
        !isCheckIn &&
        !isCheckOut &&
        !isRotatingQr
      );
    };

    // Standard survey form: allows multiple submissions
    expect(shouldShowSubmitAnother({ allowMultipleSubmissions: true })).toBe(true);

    // Form where organizer explicitly disabled multiple submissions
    expect(shouldShowSubmitAnother({ allowMultipleSubmissions: false })).toBe(false);

    // Participant just checked in for an event: must hide button
    expect(shouldShowSubmitAnother({ isCheckIn: true })).toBe(false);

    // Participant just checked out: must hide button
    expect(shouldShowSubmitAnother({ isCheckOut: true })).toBe(false);

    // Form has Live Rotating QR enabled: must hide button (requires fresh projector scan)
    expect(shouldShowSubmitAnother({ isRotatingQr: true })).toBe(false);
  });
});


