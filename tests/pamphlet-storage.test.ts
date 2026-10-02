/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState = vi.hoisted(() => ({
  user: { id: 'u1', email: 'test@example.com' },
  from: vi.fn(),
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

vi.mock('@/lib/storage/subscription', () => ({
  getEffectiveTier: vi.fn(async () => 'free'),
}));

import {
  getPamphlets,
  createPamphlet,
  getPamphletPublic,
} from '@/lib/storage/pamphlets';

beforeEach(() => {
  vi.clearAllMocks();

  const builder: any = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.neq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });

  builder.then = (resolve: any) => resolve({ data: [], error: null });

  mockState.from.mockReturnValue(builder);
});

describe('E-Pamphlet — Storage Operations', () => {
  it('getPamphlets fetches pamphlets for the authenticated user', async () => {
    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'pamphlet-1',
          user_id: 'u1',
          slug: 'majlis-anugerah',
          title: 'Majlis Hari Anugerah 2026',
          description: 'Buku program majlis',
          event_date: '2026-10-24',
          location: 'Dewan Gemilang',
          cover_image: '',
          pdf_url: '',
          theme: 'emerald',
          display_mode: 'flipbook',
          pages: [],
          action_buttons: [],
          is_active: true,
          views: 45,
          created_at: '2026-10-02T00:00:00Z',
          updated_at: '2026-10-02T00:00:00Z',
        },
      ],
      error: null,
    });

    mockState.from.mockReturnValue(builder);

    const items = await getPamphlets();
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe('majlis-anugerah');
    expect(items[0].title).toBe('Majlis Hari Anugerah 2026');
    expect(items[0].theme).toBe('emerald');
  });

  it('createPamphlet rejects invalid slugs', async () => {
    await expect(
      createPamphlet({
        slug: 'ab', // <3 chars
        title: 'Too short slug',
      })
    ).rejects.toThrow('Slug tidak sah');
  });

  it('createPamphlet enforces free tier quota', async () => {
    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockResolvedValue({
      count: 2, // Free limit is 2
      data: null,
      error: null,
    });

    mockState.from.mockReturnValue(builder);

    await expect(
      createPamphlet({
        slug: 'acara-ketiga',
        title: 'Buku Program 3',
      })
    ).rejects.toThrow('had maksimum 2 pamphlet');
  });

  it('getPamphletPublic looks up by slug using admin client', async () => {
    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.single = vi.fn().mockResolvedValue({
      data: {
        id: 'pamphlet-pub-1',
        user_id: 'u1',
        slug: 'kejohanan-sukan',
        title: 'Kejohanan Sukan Tahunan',
        theme: 'dark',
        display_mode: 'slide',
        pages: [],
        action_buttons: [],
        is_active: true,
        views: 12,
        created_at: '2026-10-02T00:00:00Z',
        updated_at: '2026-10-02T00:00:00Z',
      },
      error: null,
    });

    mockState.from.mockReturnValue(builder);

    const p = await getPamphletPublic('kejohanan-sukan');
    expect(p).not.toBeNull();
    expect(p?.title).toBe('Kejohanan Sukan Tahunan');
    expect(p?.displayMode).toBe('slide');
  });
});
