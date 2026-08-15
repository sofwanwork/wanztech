import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable Supabase mock (same recipe as audit-storage.test.ts).
const m = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.from })),
}));

import {
  insertFormResponse,
  markResponseSynced,
  markResponseSyncFailed,
  listPendingSyncResponses,
} from '@/lib/storage/form-responses';

beforeEach(() => {
  vi.clearAllMocks();
  m.from.mockReturnValue({ insert: m.insert, update: m.update, select: m.select });
  m.select.mockReturnValue({ eq: m.eq });
  m.eq.mockImplementation(() => ({
    then: (resolve: (v: unknown) => void) => resolve({ error: null }),
  }));
  // update() returns a builder carrying .eq(); awaiting the chain resolves it.
  m.update.mockImplementation(() => ({ eq: m.eq }));
});

describe('insertFormResponse', () => {
  it('returns inserted on success and writes the right row shape', async () => {
    m.insert.mockResolvedValue({ error: null });

    const result = await insertFormResponse({
      submissionId: 's1',
      formId: 'f1',
      userId: 'u1',
      data: { Name: 'Ali' },
    });

    expect(result).toBe('inserted');
    expect(m.from).toHaveBeenCalledWith('form_responses');
    expect(m.insert).toHaveBeenCalledWith({
      submission_id: 's1',
      form_id: 'f1',
      user_id: 'u1',
      data: { Name: 'Ali' },
      sheet_sync_status: 'pending',
    });
  });

  it('returns duplicate on unique-violation (23505)', async () => {
    m.insert.mockResolvedValue({ error: { code: '23505', message: 'dup' } });
    const result = await insertFormResponse({
      submissionId: 's1',
      formId: 'f1',
      userId: 'u1',
      data: {},
    });
    expect(result).toBe('duplicate');
  });

  it('returns error on other failures', async () => {
    m.insert.mockResolvedValue({ error: { code: '42P01', message: 'missing table' } });
    const result = await insertFormResponse({
      submissionId: 's1',
      formId: 'f1',
      userId: 'u1',
      data: {},
    });
    expect(result).toBe('error');
  });
});

describe('markResponseSynced / markResponseSyncFailed', () => {
  it('markResponseSynced updates status + timestamp scoped by submission_id', async () => {
    await markResponseSynced('s1');

    expect(m.from).toHaveBeenCalledWith('form_responses');
    expect(m.update).toHaveBeenCalled();
    const payload = m.update.mock.calls[0][0];
    expect(payload.sheet_sync_status).toBe('synced');
    expect(payload.sheet_sync_error).toBeNull();
    expect(payload.sheet_synced_at).toBeDefined();
    expect(m.eq).toHaveBeenCalledWith('submission_id', 's1');
  });

  it('markResponseSyncFailed keeps status pending by default (retryable)', async () => {
    await markResponseSyncFailed('s1', 'quota exceeded');

    const payload = m.update.mock.calls[0][0];
    expect(payload.sheet_sync_status).toBeUndefined();
    expect(payload.sheet_sync_error).toBe('quota exceeded');
  });

  it('markResponseSyncFailed with final:true flips status to failed (stop retrying)', async () => {
    await markResponseSyncFailed('s1', 'no sheet url', { final: true });

    const payload = m.update.mock.calls[0][0];
    expect(payload.sheet_sync_status).toBe('failed');
  });

  it('truncates very long error messages to 500 chars', async () => {
    await markResponseSyncFailed('s1', 'x'.repeat(2000));
    const payload = m.update.mock.calls[0][0];
    expect(payload.sheet_sync_error.length).toBe(500);
  });
});

describe('listPendingSyncResponses', () => {
  it('returns [] when the query errors', async () => {
    // select().eq().order().limit() chain for the pending list
    m.eq.mockImplementation(() => ({
      order: m.order,
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    }));
    m.order.mockReturnValue({ limit: m.limit });
    m.limit.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const rows = await listPendingSyncResponses();
    expect(rows).toEqual([]);
  });

  it('flattens the joined settings array and maps row + owner config', async () => {
    m.eq.mockImplementation(() => ({
      order: m.order,
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    }));
    m.order.mockReturnValue({ limit: m.limit });
    m.limit.mockResolvedValue({
      data: [
        {
          id: 'r1',
          submission_id: 's1',
          form_id: 'f1',
          user_id: 'u1',
          data: { Name: 'Ali' },
          sheet_sync_status: 'pending',
          sheet_sync_error: null,
          sheet_synced_at: null,
          created_at: '2026-07-01T00:00:00Z',
          forms: { google_sheet_url: 'https://docs.google.com/d/abc' },
          settings: [
            {
              google_client_email: 'enc-email',
              google_private_key: 'enc-key',
              google_access_token: 'enc-token',
              google_refresh_token: 'enc-refresh',
              google_token_expiry: 9999999999999,
              google_drive_folder_id: null,
            },
          ],
        },
      ],
      error: null,
    });

    const rows = await listPendingSyncResponses();

    expect(rows).toHaveLength(1);
    expect(rows[0].submissionId).toBe('s1');
    expect(rows[0].data).toEqual({ Name: 'Ali' });
    expect(rows[0].googleSheetUrl).toBe('https://docs.google.com/d/abc');
    expect(rows[0].googleClientEmail).toBe('enc-email');
    expect(rows[0].googleTokenExpiry).toBe(9999999999999);
  });

  it('handles null settings gracefully', async () => {
    m.eq.mockImplementation(() => ({
      order: m.order,
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    }));
    m.order.mockReturnValue({ limit: m.limit });
    m.limit.mockResolvedValue({
      data: [
        {
          id: 'r2',
          submission_id: 's2',
          form_id: 'f2',
          user_id: 'u2',
          data: {},
          sheet_sync_status: 'pending',
          sheet_sync_error: null,
          sheet_synced_at: null,
          created_at: '2026-07-01T00:00:00Z',
          forms: { google_sheet_url: null },
          settings: null,
        },
      ],
      error: null,
    });

    const rows = await listPendingSyncResponses();
    expect(rows[0].googleSheetUrl).toBeNull();
    expect(rows[0].googleAccessToken).toBeNull();
  });
});
