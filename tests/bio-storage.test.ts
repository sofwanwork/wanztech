/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState = vi.hoisted(() => ({
  user: { id: 'u1', email: 'test@example.com' },
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockState.user },
        error: null,
      })),
    },
    from: mockState.from,
  })),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockState.from,
  })),
}));

const mockSubState = vi.hoisted(() => ({
  effectiveTier: 'free' as 'free' | 'pro' | 'enterprise',
  effectiveTierForUser: 'free' as 'free' | 'pro' | 'enterprise',
}));

vi.mock('@/lib/storage/subscription', () => ({
  getEffectiveTier: vi.fn(async () => mockSubState.effectiveTier),
  getEffectiveTierForUser: vi.fn(async () => mockSubState.effectiveTierForUser),
}));

import {
  getBioPages,
  getBioPageByUsername,
  createBioPage,
} from '@/lib/storage/bio-links';

beforeEach(() => {
  vi.clearAllMocks();

  // Setup chainable query builder mock
  const builder: any = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.ilike = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });

  // Thenable for await on chain
  builder.then = (resolve: any) => resolve({ data: [], error: null });

  mockState.from.mockReturnValue(builder);
});

describe('KlikBio — Storage Operations', () => {
  it('getBioPages fetches bio pages for the authenticated user', async () => {
    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p1',
          user_id: 'u1',
          username: 'wan',
          title: 'Wan Tech',
          bio: 'Tech enthusiast',
          avatar_url: '',
          theme: 'emerald',
          theme_config: {},
          social_links: {},
          is_active: true,
          views: 10,
          created_at: '2026-08-30T00:00:00Z',
          updated_at: '2026-08-30T00:00:00Z',
        },
      ],
      error: null,
    });

    mockState.from.mockReturnValue(builder);

    const pages = await getBioPages();
    expect(pages).toHaveLength(1);
    expect(pages[0].username).toBe('wan');
    expect(pages[0].title).toBe('Wan Tech');
  });

  it('createBioPage rejects invalid usernames before hitting DB', async () => {
    await expect(
      createBioPage({
        username: 'ab', // <3 chars
        title: 'Short',
      })
    ).rejects.toThrow('Username must be 3-30 characters');
  });

  it('createBioPage enforces free tier quota', async () => {
    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockResolvedValue({
      count: 1, // Free limit is 1
      data: null,
      error: null,
    });

    mockState.from.mockReturnValue(builder);

    await expect(
      createBioPage({
        username: 'wan-second',
        title: 'Second Page',
      })
    ).rejects.toThrow('free bio pages limit');
  });

  it('getBioPageByUsername includes owner userTier for branding visibility control', async () => {
    const samplePageRow = {
      id: 'p-met',
      user_id: 'u-met',
      username: 'metmalaysia',
      title: 'MET Malaysia',
      bio: '',
      avatar_url: '',
      theme: 'sky',
      theme_config: {},
      social_links: {},
      is_active: true,
      views: 42,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    };

    const pageBuilder: any = {};
    pageBuilder.select = vi.fn().mockReturnValue(pageBuilder);
    pageBuilder.ilike = vi.fn().mockReturnValue(pageBuilder);
    pageBuilder.eq = vi.fn().mockReturnValue(pageBuilder);
    pageBuilder.single = vi.fn().mockResolvedValue({ data: samplePageRow, error: null });

    const linksBuilder: any = {};
    linksBuilder.select = vi.fn().mockReturnValue(linksBuilder);
    linksBuilder.eq = vi.fn().mockReturnValue(linksBuilder);
    linksBuilder.order = vi.fn().mockResolvedValue({ data: [], error: null });

    mockState.from.mockImplementation((table: string) => {
      if (table === 'bio_pages') return pageBuilder;
      return linksBuilder;
    });

    mockSubState.effectiveTierForUser = 'pro';
    const proPage = await getBioPageByUsername('metmalaysia');
    expect(proPage?.userTier).toBe('pro');

    mockSubState.effectiveTierForUser = 'free';
    const freePage = await getBioPageByUsername('metmalaysia');
    expect(freePage?.userTier).toBe('free');
  });
});
