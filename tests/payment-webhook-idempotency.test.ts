import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

/**
 * Tests for the BCL payment webhook's idempotency contract.
 *
 * The route module itself imports next/server + env-dependent code, so we
 * test the HANDLER LOGIC through the module with Supabase mocked, the same
 * approach as webhook-signature.test.ts but against the real route module.
 */

const m = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  auth: { admin: { getUserById: vi.fn() } },
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: m.from, auth: m.auth })),
}));
vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.from, auth: m.auth })),
}));
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
  getPaymentSuccessEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
  getWelcomeProEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
}));

import { POST } from '@/app/api/payment/webhook/route';

const SECRET = 'test-secret';

function makeEvent(body: object, opts?: { idParam?: string }) {
  const rawBody = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  const url = new URL('https://klikform.com/api/payment/webhook');
  if (opts?.idParam) url.searchParams.set('id', opts.idParam);
  return {
    // Minimal NextRequest stand-in with the pieces the route reads.
    text: async () => rawBody,
    headers: new Headers({
      'x-bcl-signature': signature,
      'x-forwarded-for': '1.2.3.4',
    }),
    nextUrl: { searchParams: url.searchParams },
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  m.from.mockReturnValue({ select: m.select, update: m.update, upsert: m.upsert });
  m.select.mockReturnValue({ eq: m.eq });
  // `.eq()` must satisfy two chains:
  //  - select().eq().single()  → returns { single }
  //  - update().eq()           → thenable resolving to { error: null }
  m.eq.mockImplementation(() => {
    const builder = {
      single: m.single,
      then: (resolve: (v: unknown) => void) => resolve({ error: null }),
    };
    return builder;
  });
  m.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
  // update() returns a builder carrying .eq(); awaiting the chain resolves it.
  m.update.mockImplementation(() => ({ eq: m.eq }));
  m.upsert.mockResolvedValue({ error: null });
  m.auth.admin.getUserById.mockResolvedValue({
    data: { user: { email: 'pro@example.com', user_metadata: { full_name: 'Pro User' } } },
  });
});

describe('payment webhook idempotency', () => {
  it('processes a successful payment: marks processed + upserts subscription', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({
      data: { id: 'tx1', user_id: 'u1', amount: 5, status: 'pending', processed_at: null },
      error: null,
    });

    const res = await POST(makeEvent({ status: 'paid', order_number: 'KLIK-x' }, { idParam: 'tx1' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // processed_at set in the SAME update as completed status
    const updatePayload = m.update.mock.calls[0][0];
    expect(updatePayload.status).toBe('completed');
    expect(updatePayload.processed_at).toBeDefined();
    // subscription upsert grants pro
    expect(m.upsert).toHaveBeenCalled();
    const subPayload = m.upsert.mock.calls[0][0];
    expect(subPayload.tier).toBe('pro');
  });

  it('ignores a replayed webhook when processed_at is already set (no free month)', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({
      data: {
        id: 'tx1',
        user_id: 'u1',
        amount: 5,
        status: 'completed',
        processed_at: '2026-07-01T00:00:00Z',
      },
      error: null,
    });

    const res = await POST(makeEvent({ status: 'paid' }, { idParam: 'tx1' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    // CRITICAL: must not re-extend the subscription or re-send anything
    expect(m.upsert).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.auth.admin.getUserById).not.toHaveBeenCalled();
  });

  it('looks up the transaction by order_number when no id param', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({
      data: { id: 'tx2', user_id: 'u2', amount: 5, status: 'pending', processed_at: null },
      error: null,
    });

    const res = await POST(makeEvent({ status: 'paid', order_number: 'KLIK-abc' }));
    expect(res.status).toBe(200);
    expect(m.eq).toHaveBeenCalledWith('provider_reference', 'KLIK-abc');
  });

  it('returns 404 when no transaction matches', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(makeEvent({ status: 'paid', order_number: 'KLIK-nope' }));
    expect(res.status).toBe(404);
  });

  it('marks a failed payment without setting processed_at (still re-processable)', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({
      data: { id: 'tx3', user_id: 'u3', amount: 5, status: 'pending', processed_at: null },
      error: null,
    });

    const res = await POST(makeEvent({ status: 'failed' }, { idParam: 'tx3' }));
    expect(res.status).toBe(200);
    const updatePayload = m.update.mock.calls[0][0];
    expect(updatePayload.status).toBe('failed');
    expect(updatePayload.processed_at).toBeUndefined();
  });

  it('rejects a bad signature with 401', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    const rawBody = JSON.stringify({ status: 'paid' });
    const bad = {
      text: async () => rawBody,
      headers: new Headers({ 'x-bcl-signature': 'deadbeef' }),
      nextUrl: { searchParams: new URLSearchParams() },
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(bad);
    expect(res.status).toBe(401);
  });

  it('emails are sent exactly once per processed transaction', async () => {
    process.env.BCL_WEBHOOK_SECRET = SECRET;
    m.single.mockResolvedValue({
      data: { id: 'tx4', user_id: 'u4', amount: 5, status: 'pending', processed_at: null },
      error: null,
    });

    await POST(makeEvent({ status: 'paid' }, { idParam: 'tx4' }));
    expect(m.auth.admin.getUserById).toHaveBeenCalledTimes(1);

    // Replay → no second email batch
    m.single.mockResolvedValue({
      data: { id: 'tx4', user_id: 'u4', amount: 5, status: 'completed', processed_at: 'now' },
      error: null,
    });
    await POST(makeEvent({ status: 'paid' }, { idParam: 'tx4' }));
    expect(m.auth.admin.getUserById).toHaveBeenCalledTimes(1);
  });
});
