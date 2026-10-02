import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { Pamphlet } from '@/lib/types/pamphlets';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';
import { getEffectiveTier } from '@/lib/storage/subscription';
import { cleanPamphletSlug, isValidPamphletSlug } from '@/lib/pamphlets/utils';

// Error message when database migration has not been run
export const PAMPHLET_TABLE_MISSING_MESSAGE =
  'Jadual pangkalan data "pamphlets" belum diaktifkan di Supabase. Sila jalankan migrasi SQL 20261002000000_add_pamphlets.sql di Supabase SQL Editor.';

export const PAMPHLETS_SQL_MIGRATION = `-- Migration: Add pamphlets table for E-Pamphlet & Buku Program Digital

create table if not exists public.pamphlets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null default '',
  description text default '',
  event_date text default '',
  location text default '',
  cover_image text default '',
  pdf_url text default '',
  theme text not null default 'dark',
  display_mode text not null default 'flipbook',
  pages jsonb not null default '[]'::jsonb,
  action_buttons jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pamphlets_user_id_idx on public.pamphlets (user_id);
create index if not exists pamphlets_slug_idx on public.pamphlets (slug);

-- Enable RLS
alter table public.pamphlets enable row level security;

-- Policies
drop policy if exists "pamphlets_select" on public.pamphlets;
create policy "pamphlets_select" on public.pamphlets
  for select using (auth.uid() = user_id or is_active = true);

drop policy if exists "pamphlets_insert" on public.pamphlets;
create policy "pamphlets_insert" on public.pamphlets
  for insert with check (auth.uid() = user_id);

drop policy if exists "pamphlets_update" on public.pamphlets;
create policy "pamphlets_update" on public.pamphlets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pamphlets_delete" on public.pamphlets;
create policy "pamphlets_delete" on public.pamphlets
  for delete using (auth.uid() = user_id);

-- Touch updated_at trigger
create or replace function public.set_pamphlets_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pamphlets_updated_at on public.pamphlets;
create trigger trg_pamphlets_updated_at
  before update on public.pamphlets
  for each row execute function public.set_pamphlets_updated_at();

notify pgrst, 'reload schema';
`;

/**
 * Checks whether an error represents a missing table in Supabase PostgREST (PGRST205, 42P01, etc.)
 */
export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string };
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === 'PGRST200' ||
    code === 'PGRST116' && msg.includes('pamphlets') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    details.includes('schema cache')
  );
}

// Helper to map DB row to Pamphlet model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPamphletFromRow(row: any): Pamphlet {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title || '',
    description: row.description || '',
    eventDate: row.event_date || '',
    location: row.location || '',
    coverImage: row.cover_image || '',
    pdfUrl: row.pdf_url || '',
    theme: row.theme || 'dark',
    displayMode: row.display_mode || 'flipbook',
    pages: Array.isArray(row.pages) ? row.pages : [],
    actionButtons: Array.isArray(row.action_buttons) ? row.action_buttons : [],
    isActive: row.is_active ?? true,
    views: row.views || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Check whether the pamphlets table exists and is accessible
 */
export async function isPamphletsTableReady(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('pamphlets').select('id').limit(1);
    if (error && isMissingTableError(error)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all pamphlets for the current authenticated user
 */
export async function getPamphlets(): Promise<Pamphlet[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('pamphlets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        // Table not migrated yet; return empty list gracefully without throwing
        return [];
      }
      throw error;
    }

    return (data || []).map(mapPamphletFromRow);
  } catch (err) {
    if (isMissingTableError(err)) {
      return [];
    }
    console.error('Error fetching pamphlets:', err);
    return [];
  }
}

/**
 * Get a single pamphlet by its ID
 */
export async function getPamphletById(id: string): Promise<Pamphlet | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('pamphlets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return mapPamphletFromRow(data);
  } catch {
    return null;
  }
}

/**
 * Public lookup: fetch an active pamphlet by slug (or fallback ID)
 * Uses admin client to bypass RLS for unauthenticated attendees
 */
export async function getPamphletPublic(identifier: string): Promise<Pamphlet | null> {
  const admin = createAdminClient();

  try {
    // Try lookup by slug first
    const query = admin.from('pamphlets').select('*').eq('slug', identifier).eq('is_active', true);
    let { data, error } = await query.single();

    // If not found and identifier looks like a UUID, fallback to lookup by id
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if ((!data || error) && isUUID) {
      const fallbackQuery = admin
        .from('pamphlets')
        .select('*')
        .eq('id', identifier)
        .eq('is_active', true);
      const fallbackRes = await fallbackQuery.single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error || !data) return null;
    return mapPamphletFromRow(data);
  } catch {
    return null;
  }
}

/**
 * Create a new pamphlet
 */
export async function createPamphlet(payload: {
  slug: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  coverImage?: string;
  pdfUrl?: string;
  theme?: string;
  displayMode?: string;
  pages?: unknown[];
  actionButtons?: unknown[];
}): Promise<Pamphlet> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pengguna tidak disahkan.');
  }

  const cleanSlug = cleanPamphletSlug(payload.slug);
  if (!isValidPamphletSlug(cleanSlug)) {
    throw new Error('Slug tidak sah. Sila gunakan 3-60 aksara alfanumerik dan sengkang sahaja.');
  }

  // Check tier limits
  const effectiveTier = await getEffectiveTier();
  const limits = TIER_LIMITS[effectiveTier];

  if (limits.maxPamphlets !== -1) {
    const { count, error: countErr } = await supabase
      .from('pamphlets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!countErr && (count ?? 0) >= limits.maxPamphlets) {
      throw new Error(
        `Anda telah mencapai had maksimum ${limits.maxPamphlets} pamphlet untuk pelan percuma. Sila naik taraf ke Pro untuk cipta tanpa had.`
      );
    }
  }

  // Check slug uniqueness
  const { data: existingSlug, error: slugErr } = await supabase
    .from('pamphlets')
    .select('id')
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (slugErr && isMissingTableError(slugErr)) {
    throw new Error(PAMPHLET_TABLE_MISSING_MESSAGE);
  }

  if (existingSlug) {
    throw new Error('Pautan (slug) ini telah digunakan. Sila pilih pautan lain.');
  }

  const { data, error } = await supabase
    .from('pamphlets')
    .insert({
      user_id: user.id,
      slug: cleanSlug,
      title: payload.title || 'Buku Program Tanpa Tajuk',
      description: payload.description || '',
      event_date: payload.eventDate || '',
      location: payload.location || '',
      cover_image: payload.coverImage || '',
      pdf_url: payload.pdfUrl || '',
      theme: payload.theme || 'dark',
      display_mode: payload.displayMode || 'flipbook',
      pages: payload.pages || [],
      action_buttons: payload.actionButtons || [],
      is_active: true,
      views: 0,
    })
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(PAMPHLET_TABLE_MISSING_MESSAGE);
    }
    throw new Error(error.message || 'Gagal menyimpan pamphlet.');
  }

  return mapPamphletFromRow(data);
}

/**
 * Update an existing pamphlet
 */
export async function updatePamphlet(
  id: string,
  updates: Partial<Pamphlet>
): Promise<Pamphlet> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pengguna tidak disahkan.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowUpdates: any = {};
  if (updates.title !== undefined) rowUpdates.title = updates.title;
  if (updates.description !== undefined) rowUpdates.description = updates.description;
  if (updates.eventDate !== undefined) rowUpdates.event_date = updates.eventDate;
  if (updates.location !== undefined) rowUpdates.location = updates.location;
  if (updates.coverImage !== undefined) rowUpdates.cover_image = updates.coverImage;
  if (updates.pdfUrl !== undefined) rowUpdates.pdf_url = updates.pdfUrl;
  if (updates.theme !== undefined) rowUpdates.theme = updates.theme;
  if (updates.displayMode !== undefined) rowUpdates.display_mode = updates.displayMode;
  if (updates.pages !== undefined) rowUpdates.pages = updates.pages;
  if (updates.actionButtons !== undefined) rowUpdates.action_buttons = updates.actionButtons;
  if (updates.isActive !== undefined) rowUpdates.is_active = updates.isActive;

  if (updates.slug !== undefined) {
    const cleanSlug = cleanPamphletSlug(updates.slug);
    if (!isValidPamphletSlug(cleanSlug)) {
      throw new Error('Slug tidak sah.');
    }
    // Check slug collision
    const { data: existing, error: checkSlugErr } = await supabase
      .from('pamphlets')
      .select('id')
      .eq('slug', cleanSlug)
      .neq('id', id)
      .maybeSingle();

    if (checkSlugErr && isMissingTableError(checkSlugErr)) {
      throw new Error(PAMPHLET_TABLE_MISSING_MESSAGE);
    }

    if (existing) {
      throw new Error('Pautan (slug) ini telah digunakan.');
    }
    rowUpdates.slug = cleanSlug;
  }

  const { data, error } = await supabase
    .from('pamphlets')
    .update(rowUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(PAMPHLET_TABLE_MISSING_MESSAGE);
    }
    throw new Error(error.message || 'Gagal mengemas kini pamphlet.');
  }

  return mapPamphletFromRow(data);
}

/**
 * Delete a pamphlet
 */
export async function deletePamphlet(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pengguna tidak disahkan.');
  }

  const { error } = await supabase
    .from('pamphlets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw new Error(error.message || 'Gagal memadam pamphlet.');
  }
}

/**
 * Increment views counter asynchronously
 */
export async function incrementPamphletViews(id: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('pamphlets')
      .select('views')
      .eq('id', id)
      .single();

    if (data) {
      await admin
        .from('pamphlets')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);
    }
  } catch {
    // Non-blocking counter increment
  }
}
