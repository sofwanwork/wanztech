import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  getUser: vi.fn(),
  serverFrom: vi.fn(),
  adminFrom: vi.fn(),
  encrypt: vi.fn((s: string) => `enc(${s})`),
  decrypt: vi.fn((s: string) => s.replace(/^enc\(/, '').replace(/\)$/, '')),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: m.getUser },
    from: m.serverFrom,
  })),
}));
vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.adminFrom })),
}));
vi.mock('@/lib/encryption', () => ({
  encrypt: m.encrypt,
  decrypt: m.decrypt,
}));

import {
  listWebhooksForForm,
  listWebhooksForDispatch,
  createWebhook,
} from '@/lib/storage/webhooks';

/**
 * Build a chainable query-builder mock. Every chain method returns the
 * builder; awaiting the builder resolves `result`; `.single()` resolves
 * `singleResult`.
 */
function makeBuilder(result: unknown, singleResult?: unknown) {
  const b: Record<string, unknown> = {};
  for (const meth of [
    'select',
    'eq',
    'order',
    'contains',
    'insert',
    'update',
    'delete',
  ]) {
    b[meth] = vi.fn(() => b);
  }
  b.single = vi.fn(() => Promise.resolve(singleResult ?? result));
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b;
}

function dbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w1',
    form_id: 'f1',
    user_id: 'u1',
    url: 'https://hooks.example.com/x',
    secret_encrypted: 'enc(supersecret)',
    events: ['submission'],
    enabled: true,
    last_status: 200,
    last_error: null,
    last_fired_at: null,
    created_at: '2026-06-07T00:00:00Z',
    updated_at: '2026-06-07T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
});

describe('listWebhooksForForm (builder path)', () => {
  it('masks the secret and never decrypts', async () => {
    m.serverFrom.mockReturnValue(makeBuilder({ data: [dbRow()], error: null }));

    const list = await listWebhooksForForm('f1');

    expect(list).toHaveLength(1);
    expect(list[0].secret).toBe('••••••••');
    expect(m.decrypt).not.toHaveBeenCalled();
  });

  it('returns [] on query error', async () => {
    m.serverFrom.mockReturnValue(
      makeBuilder({ data: null, error: { message: 'boom' } })
    );
    expect(await listWebhooksForForm('f1')).toEqual([]);
  });
});

describe('listWebhooksForDispatch (admin path)', () => {
  it('decrypts the secret for the dispatch path', async () => {
    m.adminFrom.mockReturnValue(makeBuilder({ data: [dbRow()], error: null }));

    const list = await listWebhooksForDispatch('f1', 'u1', 'submission');

    expect(list).toHaveLength(1);
    expect(m.decrypt).toHaveBeenCalledWith('enc(supersecret)');
    expect(list[0].secret).toBe('supersecret');
  });
});

describe('createWebhook (ownership + encryption)', () => {
  it('rejects when the form does not belong to the user', async () => {
    // forms lookup returns a different owner
    m.serverFrom.mockImplementation((table: string) => {
      if (table === 'forms') {
        return makeBuilder({}, { data: { user_id: 'someone-else' }, error: null });
      }
      return makeBuilder({ data: dbRow(), error: null }, { data: dbRow(), error: null });
    });

    await expect(
      createWebhook({
        formId: 'f1',
        url: 'https://x.com',
        secret: 's',
        events: ['submission'],
        enabled: true,
      })
    ).rejects.toThrow('Form not found or unauthorized');
  });

  it('encrypts the secret on write and returns a masked webhook', async () => {
    m.serverFrom.mockImplementation((table: string) => {
      if (table === 'forms') {
        return makeBuilder({}, { data: { user_id: 'u1' }, error: null });
      }
      // form_webhooks insert(...).select(...).single()
      return makeBuilder({}, { data: dbRow(), error: null });
    });

    const created = await createWebhook({
      formId: 'f1',
      url: 'https://hooks.example.com/x',
      secret: 'supersecret',
      events: ['submission'],
      enabled: true,
    });

    expect(m.encrypt).toHaveBeenCalledWith('supersecret');
    // Returned object masks the secret (never plaintext to the builder UI).
    expect(created.secret).toBe('••••••••');
  });
});
