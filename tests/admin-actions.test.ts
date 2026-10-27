import { describe, it, expect } from 'vitest';
import { AdminClientItem } from '@/actions/admin';

describe('Admin Client Processing & Business Logic', () => {
  const mockClients: AdminClientItem[] = [
    {
      id: 'user-1',
      email: 'ahmad@example.com',
      fullName: 'Ahmad Albab',
      username: 'ahmad',
      createdAt: '2026-01-15T08:00:00Z',
      tier: 'pro',
      status: 'active',
      currentPeriodEnd: '2026-12-31T23:59:59Z',
      formsCount: 5,
      totalSubmissions: 120,
    },
    {
      id: 'user-2',
      email: 'siti@example.com',
      fullName: 'Siti Nurhaliza',
      username: 'siti',
      createdAt: '2026-03-20T10:00:00Z',
      tier: 'free',
      status: 'active',
      formsCount: 1,
      totalSubmissions: 8,
    },
    {
      id: 'user-3',
      email: 'corp@enterprise.my',
      fullName: 'Megah Holding',
      username: 'megah',
      createdAt: '2026-04-01T12:00:00Z',
      tier: 'enterprise',
      status: 'active',
      currentPeriodEnd: '2099-12-31T23:59:59Z',
      formsCount: 24,
      totalSubmissions: 3500,
    },
    {
      id: 'user-4',
      email: 'tamat@example.com',
      fullName: 'Ali Baba',
      username: 'ali',
      createdAt: '2025-11-01T09:00:00Z',
      tier: 'pro',
      status: 'expired',
      currentPeriodEnd: '2026-02-01T00:00:00Z',
      formsCount: 2,
      totalSubmissions: 30,
    },
  ];

  it('filters clients accurately by search query across name, email, and username', () => {
    const q1 = 'albab';
    const res1 = mockClients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q1) ||
        c.email.toLowerCase().includes(q1) ||
        c.username.toLowerCase().includes(q1)
    );
    expect(res1.length).toBe(1);
    expect(res1[0].email).toBe('ahmad@example.com');

    const q2 = 'example.com';
    const res2 = mockClients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q2) ||
        c.email.toLowerCase().includes(q2) ||
        c.username.toLowerCase().includes(q2)
    );
    expect(res2.length).toBe(3);
  });

  it('filters clients accurately by subscription tier', () => {
    const proUsers = mockClients.filter((c) => c.tier === 'pro');
    expect(proUsers.length).toBe(2);

    const enterpriseUsers = mockClients.filter((c) => c.tier === 'enterprise');
    expect(enterpriseUsers.length).toBe(1);
    expect(enterpriseUsers[0].username).toBe('megah');

    const freeUsers = mockClients.filter((c) => c.tier === 'free');
    expect(freeUsers.length).toBe(1);
  });

  it('filters clients accurately by status', () => {
    const activeUsers = mockClients.filter((c) => c.status === 'active');
    expect(activeUsers.length).toBe(3);

    const expiredUsers = mockClients.filter((c) => c.status === 'expired');
    expect(expiredUsers.length).toBe(1);
    expect(expiredUsers[0].fullName).toBe('Ali Baba');
  });

  it('sorts clients correctly by creation date descending', () => {
    const sorted = [...mockClients].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    expect(sorted[0].id).toBe('user-3'); // 2026-04-01
    expect(sorted[1].id).toBe('user-2'); // 2026-03-20
    expect(sorted[2].id).toBe('user-1'); // 2026-01-15
    expect(sorted[3].id).toBe('user-4'); // 2025-11-01
  });
});
