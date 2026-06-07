import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eqSelect: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  eqUpdate: vi.fn(),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.from })),
}));

import {
  createEditToken,
  getEditToken,
  markEditTokenUsed,
} from '@/lib/storage/edit-tokens';

beforeEach(() => {
  vi.clearAllMocks();
  m.from.mockReturnValue({
    insert: m.insert,
    select: m.select,
    update: m.update,
  });
  m.select.mockReturnValue({ eq: m.eqSelect });
  m.eqSelect.mockReturnValue({ single: m.single });
  m.update.mockReturnValue({ eq: m.eqUpdate });
  m.insert.mockResolvedValue({ error: null });
  m.single.mockResolvedValue({ data: null, error: null });
  m.eqUpdate.mockResolvedValue({ error: null });
});

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 't-id',
    token: 'a'.repeat(64),
    form_id: 'f1',
    user_id: 'u1',
    submission_id: 's1',
    email: 'a@b.com',
    snapshot: { Nama: 'Ali' },
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    used_at: null,
    created_at: '2026-06-07T00:00:00Z',
    ...overrides,
  };
}

describe('createEditToken', () => {
  it('inserts the row and returns a 64-hex token with correct expiry', async () => {
    const before = Date.now();
    const token = await createEditToken({
      formId: 'f1',
      userId: 'u1',
      submissionId: 's1',
      email: 'a@b.com',
      snapshot: { Nama: 'Ali' },
      expiryDays: 7,
    });

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(m.from).toHaveBeenCalledWith('response_edit_tokens');

    const arg = m.insert.mock.calls[0][0];
    expect(arg).toMatchObject({
      token,
      form_id: 'f1',
      user_id: 'u1',
      submission_id: 's1',
      email: 'a@b.com',
      snapshot: { Nama: 'Ali' },
    });
    const expiry = new Date(arg.expires_at).getTime();
    const expected = before + 7 * 86400000;
    // Within a 5s tolerance of the expected 7-day expiry.
    expect(Math.abs(expiry - expected)).toBeLessThan(5000);
  });

  it('throws when the insert errors', async () => {
    m.insert.mockResolvedValue({ error: { message: 'db down' } });
    await expect(
      createEditToken({
        formId: 'f1',
        userId: 'u1',
        submissionId: 's1',
        email: null,
        snapshot: {},
        expiryDays: 7,
      })
    ).rejects.toThrow('Failed to create edit token');
  });
});

describe('getEditToken', () => {
  it('returns not_found for empty/short tokens without hitting the DB', async () => {
    expect(await getEditToken('')).toEqual({ valid: false, reason: 'not_found' });
    expect(await getEditToken('short')).toEqual({ valid: false, reason: 'not_found' });
    expect(m.from).not.toHaveBeenCalled();
  });

  it('returns not_found when no row matches', async () => {
    m.single.mockResolvedValue({ data: null, error: { message: 'no rows' } });
    expect(await getEditToken('a'.repeat(64))).toEqual({
      valid: false,
      reason: 'not_found',
    });
  });

  it('returns used when the token was already consumed', async () => {
    m.single.mockResolvedValue({
      data: validRow({ used_at: '2026-06-06T00:00:00Z' }),
      error: null,
    });
    expect(await getEditToken('a'.repeat(64))).toEqual({
      valid: false,
      reason: 'used',
    });
  });

  it('returns expired when past expiry', async () => {
    m.single.mockResolvedValue({
      data: validRow({ expires_at: new Date(Date.now() - 1000).toISOString() }),
      error: null,
    });
    expect(await getEditToken('a'.repeat(64))).toEqual({
      valid: false,
      reason: 'expired',
    });
  });

  it('returns the mapped row when valid', async () => {
    m.single.mockResolvedValue({ data: validRow(), error: null });
    const res = await getEditToken('a'.repeat(64));
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.row).toMatchObject({
        id: 't-id',
        formId: 'f1',
        userId: 'u1',
        submissionId: 's1',
        email: 'a@b.com',
        snapshot: { Nama: 'Ali' },
      });
    }
    expect(m.eqSelect).toHaveBeenCalledWith('token', 'a'.repeat(64));
  });
});

describe('markEditTokenUsed', () => {
  it('updates used_at scoped to the row id', async () => {
    await markEditTokenUsed('t-id');
    expect(m.from).toHaveBeenCalledWith('response_edit_tokens');
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({ used_at: expect.any(String) })
    );
    expect(m.eqUpdate).toHaveBeenCalledWith('id', 't-id');
  });

  it('never throws when the update errors', async () => {
    m.eqUpdate.mockResolvedValue({ error: { message: 'fail' } });
    await expect(markEditTokenUsed('t-id')).resolves.toBeUndefined();
  });
});
