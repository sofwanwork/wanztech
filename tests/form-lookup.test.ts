/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<any>('react');
  return {
    ...actual,
    cache: (fn: any) => fn,
  };
});

const mockState = vi.hoisted(() => ({
  user: { id: 'u1', email: 'test@example.com' },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
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
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { tier: 'pro' }, error: null }),
        }),
      }),
    }),
  })),
}));

import { getFormByIdOrShortCode } from '@/lib/storage/forms';

const sampleDbForm = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: 'u1',
  title: 'Borang Pendaftaran',
  description: 'Sila isi borang ini',
  short_code: 'daftarkursus',
  cover_image: null,
  thank_you_message: 'Terima kasih',
  redirect_buttons: null,
  google_sheet_url: null,
  allow_multiple_submissions: true,
  fields: [],
  created_at: '2026-09-01T00:00:00Z',
  e_certificate_enabled: false,
  e_certificate_template: null,
  receive_email_notifications: true,
  attendance_settings: null,
  qr_settings: null,
  theme: null,
  is_active: true,
};

describe('Forms Storage — getFormByIdOrShortCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('looks up by UUID first when given a valid UUID string', async () => {
    const eqCalls: [string, any][] = [];

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn((col: string, val: any) => {
      eqCalls.push([col, val]);
      return builder;
    });
    builder.single = vi.fn().mockResolvedValue({ data: sampleDbForm, error: null });

    mockState.from.mockReturnValue(builder);

    const form = await getFormByIdOrShortCode('550e8400-e29b-41d4-a716-446655440000');
    expect(form).toBeDefined();
    expect(form?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(eqCalls[0]).toEqual(['id', '550e8400-e29b-41d4-a716-446655440000']);
  });

  it('looks up by short_code first when given a non-UUID slug', async () => {
    const eqCalls: [string, any][] = [];

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn((col: string, val: any) => {
      eqCalls.push([col, val]);
      return builder;
    });
    builder.single = vi.fn().mockResolvedValue({ data: sampleDbForm, error: null });

    mockState.from.mockReturnValue(builder);

    const form = await getFormByIdOrShortCode('daftarkursus');
    expect(form).toBeDefined();
    expect(form?.title).toBe('Borang Pendaftaran');
    expect(eqCalls[0]).toEqual(['short_code', 'daftarkursus']);
  });

  it('falls back to short_code if UUID query returns not found', async () => {
    const eqCalls: [string, any][] = [];

    const builder: any = {};
    builder.select = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn((col: string, val: any) => {
      eqCalls.push([col, val]);
      return builder;
    });
    // First call (id): not found
    // Second call (short_code): found
    builder.single = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
      .mockResolvedValueOnce({ data: sampleDbForm, error: null });

    mockState.from.mockReturnValue(builder);

    const form = await getFormByIdOrShortCode('550e8400-e29b-41d4-a716-446655440001');
    expect(form).toBeDefined();
    expect(eqCalls).toEqual([
      ['id', '550e8400-e29b-41d4-a716-446655440001'],
      ['short_code', '550e8400-e29b-41d4-a716-446655440001'],
    ]);
  });

  it('returns undefined for empty identifier', async () => {
    const form = await getFormByIdOrShortCode('');
    expect(form).toBeUndefined();
  });
});
