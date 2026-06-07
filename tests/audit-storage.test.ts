import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock fns (hoisted so the vi.mock factories below can reference them).
const m = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: m.getUser },
    from: m.from,
  })),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.from })),
}));

import { logAudit, listAuditLogs } from '@/lib/storage/audit';

beforeEach(() => {
  vi.clearAllMocks();
  // Chain wiring:
  //  from -> { select, insert }
  //  select -> { eq } -> { order } -> { limit } -> Promise<{data,error}>
  m.from.mockReturnValue({ select: m.select, insert: m.insert });
  m.select.mockReturnValue({ eq: m.eq });
  m.eq.mockReturnValue({ order: m.order });
  m.order.mockReturnValue({ limit: m.limit });
  m.limit.mockResolvedValue({ data: [], error: null });
  m.insert.mockResolvedValue({ error: null });
});

describe('logAudit', () => {
  it('inserts the correct row shape when a user is present', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    await logAudit({
      action: 'form.create',
      entityType: 'form',
      entityId: 'f1',
      metadata: { title: 'My Form' },
    });

    expect(m.from).toHaveBeenCalledWith('audit_logs');
    expect(m.insert).toHaveBeenCalledWith({
      user_id: 'u1',
      action: 'form.create',
      entity_type: 'form',
      entity_id: 'f1',
      metadata: { title: 'My Form' },
    });
  });

  it('defaults entity_id to null and metadata to {} when omitted', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u2' } } });

    await logAudit({ action: 'settings.update', entityType: 'settings' });

    expect(m.insert).toHaveBeenCalledWith({
      user_id: 'u2',
      action: 'settings.update',
      entity_type: 'settings',
      entity_id: null,
      metadata: {},
    });
  });

  it('does NOT insert when there is no authenticated user', async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });

    await logAudit({ action: 'form.delete', entityType: 'form', entityId: 'x' });

    expect(m.insert).not.toHaveBeenCalled();
  });

  it('never throws — swallows errors (fire-and-forget)', async () => {
    m.getUser.mockRejectedValue(new Error('boom'));

    await expect(
      logAudit({ action: 'form.create', entityType: 'form' })
    ).resolves.toBeUndefined();
  });
});

describe('listAuditLogs', () => {
  it('returns [] when there is no authenticated user', async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    expect(await listAuditLogs()).toEqual([]);
    expect(m.from).not.toHaveBeenCalled();
  });

  it('queries scoped to the user and maps rows to camelCase', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    m.limit.mockResolvedValue({
      data: [
        {
          id: 'a1',
          user_id: 'u1',
          action: 'form.create',
          entity_type: 'form',
          entity_id: 'f1',
          metadata: { title: 'X' },
          created_at: '2026-06-07T00:00:00Z',
        },
        {
          id: 'a2',
          user_id: 'u1',
          action: 'form.delete',
          entity_type: 'form',
          entity_id: null,
          metadata: null,
          created_at: '2026-06-06T00:00:00Z',
        },
      ],
      error: null,
    });

    const logs = await listAuditLogs();

    expect(m.from).toHaveBeenCalledWith('audit_logs');
    expect(m.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(m.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(logs).toEqual([
      {
        id: 'a1',
        userId: 'u1',
        action: 'form.create',
        entityType: 'form',
        entityId: 'f1',
        metadata: { title: 'X' },
        createdAt: '2026-06-07T00:00:00Z',
      },
      {
        id: 'a2',
        userId: 'u1',
        action: 'form.delete',
        entityType: 'form',
        entityId: undefined,
        metadata: {},
        createdAt: '2026-06-06T00:00:00Z',
      },
    ]);
  });

  it('clamps the limit between 1 and 200', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    await listAuditLogs(9999);
    expect(m.limit).toHaveBeenLastCalledWith(200);

    await listAuditLogs(0);
    expect(m.limit).toHaveBeenLastCalledWith(1);

    await listAuditLogs();
    expect(m.limit).toHaveBeenLastCalledWith(50);
  });

  it('returns [] when the query errors', async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    m.limit.mockResolvedValue({ data: null, error: { message: 'fail' } });
    expect(await listAuditLogs()).toEqual([]);
  });
});
