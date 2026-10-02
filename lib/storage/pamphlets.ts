import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { Pamphlet } from '@/lib/types/pamphlets';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';
import { getEffectiveTier } from '@/lib/storage/subscription';
import { cleanPamphletSlug, isValidPamphletSlug } from '@/lib/pamphlets/utils';

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
      // Graceful fallback if table does not exist yet (42P01)
      if (error.code === '42P01') {
        console.warn('public.pamphlets table does not exist yet.');
        return [];
      }
      throw error;
    }

    return (data || []).map(mapPamphletFromRow);
  } catch (err) {
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
  const { data: existingSlug } = await supabase
    .from('pamphlets')
    .select('id')
    .eq('slug', cleanSlug)
    .single();

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
    const { data: existing } = await supabase
      .from('pamphlets')
      .select('id')
      .eq('slug', cleanSlug)
      .neq('id', id)
      .single();

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
