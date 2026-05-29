import { describe, it, expect } from 'vitest';
import {
  signPayload,
  verifySignature,
  dispatchWebhook,
  SIGNATURE_HEADER,
} from '@/lib/webhooks/dispatch';
import type { WebhookSubmissionPayload } from '@/lib/types/webhooks';

const samplePayload: WebhookSubmissionPayload = {
  event: 'submission',
  formId: 'form-123',
  formTitle: 'Pendaftaran Webinar',
  submittedAt: '2026-05-29T03:00:00.000Z',
  data: { Name: 'Ali', Email: 'ali@example.com' },
};

describe('signPayload / verifySignature', () => {
  it('produces a stable hex digest for the same body+secret', () => {
    const body = JSON.stringify(samplePayload);
    const sig1 = signPayload(body, 'shhh');
    const sig2 = signPayload(body, 'shhh');
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifies a correct signature', () => {
    const body = JSON.stringify(samplePayload);
    const sig = signPayload(body, 'shhh');
    expect(verifySignature(body, 'shhh', sig)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify(samplePayload);
    const sig = signPayload(body, 'shhh');
    const tampered = body.replace('Ali', 'Hacker');
    expect(verifySignature(tampered, 'shhh', sig)).toBe(false);
  });

  it('rejects with the wrong secret', () => {
    const body = JSON.stringify(samplePayload);
    const sig = signPayload(body, 'shhh');
    expect(verifySignature(body, 'different', sig)).toBe(false);
  });

  it('rejects malformed signature gracefully', () => {
    const body = JSON.stringify(samplePayload);
    expect(verifySignature(body, 'shhh', 'not-hex')).toBe(false);
    expect(verifySignature(body, 'shhh', '')).toBe(false);
  });
});

describe('dispatchWebhook', () => {
  it('signs body and POSTs with the canonical header', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchMock = (async (url: string | URL, init?: RequestInit) => {
      captured = { url: String(url), init: init! };
      return new Response('ok', { status: 200 });
    }) as typeof fetch;

    const out = await dispatchWebhook({
      url: 'https://example.com/hook',
      secret: 'shhh',
      payload: samplePayload,
      fetchImpl: fetchMock,
      sleepImpl: async () => {},
    });

    expect(out.ok).toBe(true);
    expect(out.status).toBe(200);
    expect(out.attempts).toBe(1);
    expect(captured).not.toBeNull();
    const headers = captured!.init.headers as Record<string, string>;
    const sig = headers[SIGNATURE_HEADER];
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifySignature(String(captured!.init.body), 'shhh', sig)).toBe(true);
  });

  it('does NOT retry on a 4xx response', async () => {
    let calls = 0;
    const fetchMock = (async () => {
      calls++;
      return new Response('bad', { status: 400 });
    }) as typeof fetch;

    const out = await dispatchWebhook({
      url: 'https://example.com/hook',
      secret: 's',
      payload: samplePayload,
      fetchImpl: fetchMock,
      sleepImpl: async () => {},
    });

    expect(out.ok).toBe(false);
    expect(out.status).toBe(400);
    expect(calls).toBe(1);
    expect(out.attempts).toBe(1);
  });

  it('retries up to maxAttempts on 5xx', async () => {
    let calls = 0;
    const fetchMock = (async () => {
      calls++;
      return new Response('boom', { status: 502 });
    }) as typeof fetch;

    const out = await dispatchWebhook({
      url: 'https://example.com/hook',
      secret: 's',
      payload: samplePayload,
      maxAttempts: 3,
      fetchImpl: fetchMock,
      sleepImpl: async () => {},
    });

    expect(out.ok).toBe(false);
    expect(out.status).toBe(502);
    expect(calls).toBe(3);
    expect(out.attempts).toBe(3);
  });

  it('retries on network errors and succeeds on a later attempt', async () => {
    let calls = 0;
    const fetchMock = (async () => {
      calls++;
      if (calls < 3) throw new Error('ECONNRESET');
      return new Response('ok', { status: 200 });
    }) as typeof fetch;

    const out = await dispatchWebhook({
      url: 'https://example.com/hook',
      secret: 's',
      payload: samplePayload,
      maxAttempts: 5,
      fetchImpl: fetchMock,
      sleepImpl: async () => {},
    });

    expect(out.ok).toBe(true);
    expect(out.status).toBe(200);
    expect(calls).toBe(3);
    expect(out.attempts).toBe(3);
  });
});
