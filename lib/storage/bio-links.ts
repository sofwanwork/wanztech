import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { BioPage, BioLink, BioPageWithLinks, BioTheme, BioSocialLinks, BioThemeConfig, BioLinkType } from '@/lib/types/bio-links';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';
import { isValidBioUsername, cleanBioUsername } from '@/lib/bio-links/themes';

// Helper to authenticate user
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { supabase, user };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPageFromRow(row: any): BioPage {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    title: row.title || '',
    bio: row.bio || '',
    avatarUrl: row.avatar_url || '',
    theme: (row.theme || 'emerald') as BioTheme,
    themeConfig: (row.theme_config || {}) as BioThemeConfig,
    socialLinks: (row.social_links || {}) as BioSocialLinks,
    isActive: row.is_active ?? true,
    views: row.views || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLinkFromRow(row: any): BioLink {
  return {
    id: row.id,
    bioPageId: row.bio_page_id,
    userId: row.user_id,
    type: (row.type || 'link') as BioLinkType,
    title: row.title || '',
    url: row.url || '',
    icon: row.icon || '',
    highlight: row.highlight ?? false,
    isActive: row.is_active ?? true,
    clicks: row.clicks || 0,
    orderIndex: row.order_index ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all bio pages belonging to current user
 */
export async function getBioPages(): Promise<BioPage[]> {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from('bio_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bio pages:', error);
    return [];
  }

  return (data || []).map(mapPageFromRow);
}

/**
 * Get a specific bio page by ID with ownership check
 */
export async function getBioPageById(id: string): Promise<BioPageWithLinks | null> {
  const { supabase, user } = await getUser();

  const { data: pageRow, error: pageError } = await supabase
    .from('bio_pages')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (pageError || !pageRow) {
    return null;
  }

  const { data: linksRows, error: linksError } = await supabase
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', id)
    .order('order_index', { ascending: true });

  if (linksError) {
    console.error('Error fetching bio links:', linksError);
  }

  const page = mapPageFromRow(pageRow);
  const links = (linksRows || []).map(mapLinkFromRow);

  return {
    ...page,
    links,
  };
}

/**
 * Public query: Fetch active bio page and active links by username
 * Uses admin client to bypass RLS for unauthenticated visitors
 */
export async function getBioPageByUsername(username: string): Promise<BioPageWithLinks | null> {
  const admin = createAdminClient();
  const cleanUser = cleanBioUsername(username);

  const { data: pageRow, error: pageError } = await admin
    .from('bio_pages')
    .select('*')
    .ilike('username', cleanUser)
    .eq('is_active', true)
    .single();

  if (pageError || !pageRow) {
    return null;
  }

  const { data: linksRows, error: linksError } = await admin
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', pageRow.id)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (linksError) {
    console.error('Error fetching public bio links:', linksError);
  }

  const page = mapPageFromRow(pageRow);
  const links = (linksRows || []).map(mapLinkFromRow);

  return {
    ...page,
    links,
  };
}

/**
 * Create a new bio page
 */
export async function createBioPage(payload: {
  username: string;
  title: string;
  bio?: string;
  theme?: BioTheme;
}): Promise<BioPage> {
  const { supabase, user } = await getUser();

  const cleanUser = cleanBioUsername(payload.username);
  if (!isValidBioUsername(cleanUser)) {
    throw new Error('Username mestilah 3-30 aksara (huruf kecil, nombor, tanda tolak & garis bawah sahaja).');
  }

  // Check limits and subscription
  const { getEffectiveTier } = await import('@/lib/storage/subscription');
  const effectiveTier = await getEffectiveTier();
  const limits = TIER_LIMITS[effectiveTier];

  if (limits.maxBioPages !== -1) {
    const { count } = await supabase
      .from('bio_pages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= limits.maxBioPages) {
      throw new Error(`Anda telah mencapai had halaman bio percuma (${limits.maxBioPages}). Sila naik taraf ke Pro untuk cipta lebih banyak.`);
    }
  }

  const { data, error } = await supabase
    .from('bio_pages')
    .insert({
      user_id: user.id,
      username: cleanUser,
      title: payload.title || cleanUser,
      bio: payload.bio || '',
      theme: payload.theme || 'emerald',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Username "${cleanUser}" telah digunakan. Sila pilih username lain.`);
    }
    console.error('Create bio page error:', error);
    throw new Error('Gagal mencipta halaman bio: ' + error.message);
  }

  return mapPageFromRow(data);
}

/**
 * Update bio page details
 */
export async function updateBioPage(
  id: string,
  updates: Partial<BioPage>
): Promise<BioPage> {
  const { supabase, user } = await getUser();

  const updatePayload: Record<string, unknown> = {};

  if (updates.username !== undefined) {
    const cleanUser = cleanBioUsername(updates.username);
    if (!isValidBioUsername(cleanUser)) {
      throw new Error('Username mestilah 3-30 aksara (huruf kecil, nombor, tanda tolak & garis bawah sahaja).');
    }
    updatePayload.username = cleanUser;
  }

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.bio !== undefined) updatePayload.bio = updates.bio;
  if (updates.avatarUrl !== undefined) updatePayload.avatar_url = updates.avatarUrl;
  if (updates.theme !== undefined) updatePayload.theme = updates.theme;
  if (updates.themeConfig !== undefined) updatePayload.theme_config = updates.themeConfig;
  if (updates.socialLinks !== undefined) updatePayload.social_links = updates.socialLinks;
  if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('bio_pages')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Username ini telah digunakan oleh profil lain.');
    }
    console.error('Update bio page error:', error);
    throw new Error('Gagal mengemas kini halaman bio: ' + error.message);
  }

  return mapPageFromRow(data);
}

/**
 * Delete a bio page
 */
export async function deleteBioPage(id: string): Promise<boolean> {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from('bio_pages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete bio page error:', error);
    throw new Error('Gagal memadam halaman bio: ' + error.message);
  }

  return true;
}

/**
 * Create a new bio link
 */
export async function createBioLink(
  bioPageId: string,
  payload: {
    type?: BioLinkType;
    title: string;
    url?: string;
    icon?: string;
    highlight?: boolean;
  }
): Promise<BioLink> {
  const { supabase, user } = await getUser();

  // Verify page ownership
  const { data: page, error: pageErr } = await supabase
    .from('bio_pages')
    .select('id')
    .eq('id', bioPageId)
    .eq('user_id', user.id)
    .single();

  if (pageErr || !page) {
    throw new Error('Halaman bio tidak dijumpai.');
  }

  // Get max order index
  const { data: maxOrderData } = await supabase
    .from('bio_links')
    .select('order_index')
    .eq('bio_page_id', bioPageId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrderData && maxOrderData[0]?.order_index !== undefined)
    ? maxOrderData[0].order_index + 1
    : 0;

  const { data, error } = await supabase
    .from('bio_links')
    .insert({
      bio_page_id: bioPageId,
      user_id: user.id,
      type: payload.type || 'link',
      title: payload.title,
      url: payload.url || '',
      icon: payload.icon || '',
      highlight: payload.highlight ?? false,
      is_active: true,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Create bio link error:', error);
    throw new Error('Gagal menambah pautan: ' + error.message);
  }

  return mapLinkFromRow(data);
}

/**
 * Update a bio link
 */
export async function updateBioLink(
  id: string,
  updates: Partial<BioLink>
): Promise<BioLink> {
  const { supabase, user } = await getUser();

  const updatePayload: Record<string, unknown> = {};
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.url !== undefined) updatePayload.url = updates.url;
  if (updates.type !== undefined) updatePayload.type = updates.type;
  if (updates.icon !== undefined) updatePayload.icon = updates.icon;
  if (updates.highlight !== undefined) updatePayload.highlight = updates.highlight;
  if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;
  if (updates.orderIndex !== undefined) updatePayload.order_index = updates.orderIndex;

  const { data, error } = await supabase
    .from('bio_links')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Update bio link error:', error);
    throw new Error('Gagal mengemas kini pautan: ' + error.message);
  }

  return mapLinkFromRow(data);
}

/**
 * Delete a bio link
 */
export async function deleteBioLink(id: string): Promise<boolean> {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from('bio_links')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete bio link error:', error);
    throw new Error('Gagal memadam pautan: ' + error.message);
  }

  return true;
}

/**
 * Reorder links within a bio page
 */
export async function reorderBioLinks(
  bioPageId: string,
  orderedLinkIds: string[]
): Promise<boolean> {
  const { supabase, user } = await getUser();

  // Verify page ownership
  const { data: page, error: pageErr } = await supabase
    .from('bio_pages')
    .select('id')
    .eq('id', bioPageId)
    .eq('user_id', user.id)
    .single();

  if (pageErr || !page) {
    throw new Error('Halaman bio tidak dijumpai.');
  }

  // Update order_index for each id in list
  for (let i = 0; i < orderedLinkIds.length; i++) {
    const linkId = orderedLinkIds[i];
    await supabase
      .from('bio_links')
      .update({ order_index: i })
      .eq('id', linkId)
      .eq('bio_page_id', bioPageId)
      .eq('user_id', user.id);
  }

  return true;
}

/**
 * Increment page view counter (Public / fire-and-forget)
 */
export async function incrementBioPageView(pageId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: page } = await admin
      .from('bio_pages')
      .select('views')
      .eq('id', pageId)
      .single();

    if (page) {
      await admin
        .from('bio_pages')
        .update({ views: (page.views || 0) + 1 })
        .eq('id', pageId);
    }
  } catch (err) {
    console.warn('Failed to increment bio page view:', err);
  }
}

/**
 * Increment link click counter (Public / fire-and-forget)
 */
export async function incrementBioLinkClick(linkId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: link } = await admin
      .from('bio_links')
      .select('clicks')
      .eq('id', linkId)
      .single();

    if (link) {
      await admin
        .from('bio_links')
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq('id', linkId);
    }
  } catch (err) {
    console.warn('Failed to increment bio link click:', err);
  }
}
