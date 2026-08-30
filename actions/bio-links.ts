'use server';

import { revalidatePath } from 'next/cache';
import {
  createBioPage,
  updateBioPage,
  deleteBioPage,
  createBioLink,
  updateBioLink,
  deleteBioLink,
  reorderBioLinks,
  incrementBioLinkClick,
} from '@/lib/storage/bio-links';
import { BioPage, BioLink, BioTheme, BioLinkType } from '@/lib/types/bio-links';

export async function createBioPageAction(payload: {
  username: string;
  title: string;
  bio?: string;
  theme?: BioTheme;
}) {
  try {
    const page = await createBioPage(payload);
    revalidatePath('/bio');
    return { success: true, page, id: page.id };
  } catch (error) {
    console.error('Failed to create bio page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mencipta halaman bio.',
    };
  }
}

export async function updateBioPageAction(
  id: string,
  updates: Partial<BioPage>
) {
  try {
    const page = await updateBioPage(id, updates);
    revalidatePath('/bio');
    revalidatePath(`/bio/${id}`);
    if (page.username) {
      revalidatePath(`/bio/${page.username}`);
      revalidatePath(`/b/${page.username}`);
    }
    return { success: true, page };
  } catch (error) {
    console.error('Failed to update bio page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengemas kini halaman bio.',
    };
  }
}

export async function deleteBioPageAction(id: string) {
  try {
    await deleteBioPage(id);
    revalidatePath('/bio');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete bio page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memadam halaman bio.',
    };
  }
}

export async function createBioLinkAction(
  bioPageId: string,
  payload: {
    type?: BioLinkType;
    title: string;
    url?: string;
    icon?: string;
    highlight?: boolean;
  }
) {
  try {
    const link = await createBioLink(bioPageId, payload);
    revalidatePath(`/bio/${bioPageId}`);
    return { success: true, link };
  } catch (error) {
    console.error('Failed to create bio link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menambah pautan.',
    };
  }
}

export async function updateBioLinkAction(
  id: string,
  bioPageId: string,
  updates: Partial<BioLink>
) {
  try {
    const link = await updateBioLink(id, updates);
    revalidatePath(`/bio/${bioPageId}`);
    return { success: true, link };
  } catch (error) {
    console.error('Failed to update bio link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengemas kini pautan.',
    };
  }
}

export async function deleteBioLinkAction(id: string, bioPageId: string) {
  try {
    await deleteBioLink(id);
    revalidatePath(`/bio/${bioPageId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete bio link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal memadam pautan.',
    };
  }
}

export async function reorderBioLinksAction(
  bioPageId: string,
  orderedLinkIds: string[]
) {
  try {
    await reorderBioLinks(bioPageId, orderedLinkIds);
    revalidatePath(`/bio/${bioPageId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to reorder bio links:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyusun pautan.',
    };
  }
}

export async function trackBioClickAction(linkId: string) {
  try {
    await incrementBioLinkClick(linkId);
    return { success: true };
  } catch (error) {
    console.warn('Failed to track bio click:', error);
    return { success: false };
  }
}
