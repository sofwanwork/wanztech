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
  updatePamphlet,
  getPamphletPublic,
  isMissingTableError,
  isUniqueViolationError,
  isPamphletsTableReady,
  PAMPHLET_TABLE_MISSING_MESSAGE,
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
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

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
    ).rejects.toThrow('Invalid slug');
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
    ).rejects.toThrow('maximum limit of 2 pamphlets');
  });

  it('createPamphlet automatically appends a unique suffix when the requested slug is already taken', async () => {
    const insertedPayloads: any[] = [];
    let slugCheckCalls = 0;

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.insert = vi.fn((payload: any) => {
      insertedPayloads.push(payload);
      return builder;
    });
    builder.maybeSingle = vi.fn(async () => {
      slugCheckCalls += 1;
      // First check ('test') collides with an existing pamphlet; second check ('test-xxxx') is free
      if (slugCheckCalls === 1) {
        return { data: { id: 'existing-other-user' }, error: null };
      }
      return { data: null, error: null };
    });
    builder.single = vi.fn(async () => {
      const last = insertedPayloads[insertedPayloads.length - 1];
      return {
        data: {
          id: 'pamphlet-new',
          user_id: 'u1',
          slug: last.slug,
          title: last.title,
          theme: 'light',
          display_mode: 'flipbook',
          pages: [],
          action_buttons: [],
          is_active: true,
          views: 0,
          created_at: '2026-11-24T00:00:00Z',
          updated_at: '2026-11-24T00:00:00Z',
        },
        error: null,
      };
    });
    builder.then = (resolve: any) => resolve({ count: 0, data: null, error: null });

    mockState.from.mockReturnValue(builder);

    const created = await createPamphlet({
      slug: 'test',
      title: 'test',
    });

    expect(created.title).toBe('test');
    expect(created.slug).toMatch(/^test-[a-z0-9]{4}$/);
    expect(slugCheckCalls).toBe(2);
  });

  it('createPamphlet retries with a fresh suffix when a concurrent insert triggers Postgres 23505', async () => {
    const insertedSlugs: string[] = [];
    let insertAttempt = 0;

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.insert = vi.fn((payload: any) => {
      insertedSlugs.push(payload.slug);
      return builder;
    });
    builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.single = vi.fn(async () => {
      insertAttempt += 1;
      if (insertAttempt === 1) {
        return {
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "pamphlets_slug_key"' },
        };
      }
      const slug = insertedSlugs[insertedSlugs.length - 1];
      return {
        data: {
          id: 'pamphlet-race-ok',
          user_id: 'u1',
          slug,
          title: 'Hari Sukan 2026',
          theme: 'light',
          display_mode: 'flipbook',
          pages: [],
          action_buttons: [],
          is_active: true,
          views: 0,
          created_at: '2026-11-24T00:00:00Z',
          updated_at: '2026-11-24T00:00:00Z',
        },
        error: null,
      };
    });
    builder.then = (resolve: any) => resolve({ count: 0, data: null, error: null });

    mockState.from.mockReturnValue(builder);

    const created = await createPamphlet({
      slug: 'hari-sukan-2026',
      title: 'Hari Sukan 2026',
    });

    expect(insertAttempt).toBe(2);
    expect(insertedSlugs[0]).toBe('hari-sukan-2026');
    expect(created.slug).toMatch(/^hari-sukan-2026-[a-z0-9]{4}$/);
  });

  it('updatePamphlet returns a friendly error on duplicate slug violation', async () => {
    expect(isUniqueViolationError({ code: '23505' })).toBe(true);
    expect(isUniqueViolationError({ message: 'duplicate key value violates unique constraint' })).toBe(true);
    expect(isUniqueViolationError({ code: 'PGRST205' })).toBe(false);

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.update = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.neq = vi.fn().mockReturnValue(builder);
    builder.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'other-id' }, error: null });

    mockState.from.mockReturnValue(builder);

    await expect(
      updatePamphlet('my-id', { slug: 'taken-slug' })
    ).rejects.toThrow('already in use');
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

  describe('PostgREST PGRST205 & Missing Table Resilience', () => {
    it('isMissingTableError correctly identifies PGRST205, 42P01, and schema cache errors', () => {
      expect(isMissingTableError({ code: 'PGRST205', message: "Could not find the table 'public.pamphlets' in the schema cache" })).toBe(true);
      expect(isMissingTableError({ code: '42P01', message: 'relation "pamphlets" does not exist' })).toBe(true);
      expect(isMissingTableError({ code: 'PGRST204' })).toBe(true);
      expect(isMissingTableError({ message: 'could not find the table in schema cache' })).toBe(true);
      expect(isMissingTableError({ code: '23505', message: 'duplicate key' })).toBe(false);
      expect(isMissingTableError(null)).toBe(false);
    });

    it('getPamphlets returns empty array gracefully when table is missing (PGRST205)', async () => {
      const builder: any = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.order = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST205',
          message: "Could not find the table 'public.pamphlets' in the schema cache",
        },
      });

      mockState.from.mockReturnValue(builder);

      const items = await getPamphlets();
      expect(items).toEqual([]);
    });

    it('isPamphletsTableReady returns false when PGRST205 is encountered and true when healthy', async () => {
      // 1. Table missing case
      const missingBuilder: any = {};
      missingBuilder.select = vi.fn().mockReturnValue(missingBuilder);
      missingBuilder.limit = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST205',
          message: "Could not find the table 'public.pamphlets' in the schema cache",
        },
      });
      mockState.from.mockReturnValue(missingBuilder);

      const readyBefore = await isPamphletsTableReady();
      expect(readyBefore).toBe(false);

      // 2. Table healthy case
      const healthyBuilder: any = {};
      healthyBuilder.select = vi.fn().mockReturnValue(healthyBuilder);
      healthyBuilder.limit = vi.fn().mockResolvedValue({
        data: [{ id: 'pamphlet-1' }],
        error: null,
      });
      mockState.from.mockReturnValue(healthyBuilder);

      const readyAfter = await isPamphletsTableReady();
      expect(readyAfter).toBe(true);
    });

    it('createPamphlet throws clear migration guidance message when table is missing', async () => {
      const builder: any = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST205',
          message: "Could not find the table 'public.pamphlets' in the schema cache",
        },
      });
      builder.then = (resolve: any) => resolve({ count: 0, data: null, error: null });

      mockState.from.mockReturnValue(builder);

      await expect(
        createPamphlet({
          slug: 'majlis-tahunan',
          title: 'Majlis Tahunan 2026',
        })
      ).rejects.toThrow(PAMPHLET_TABLE_MISSING_MESSAGE);
    });
  });
});
