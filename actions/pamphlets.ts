'use server';

import { revalidatePath } from 'next/cache';
import {
  createPamphlet,
  updatePamphlet,
  deletePamphlet,
  incrementPamphletViews,
} from '@/lib/storage/pamphlets';
import { Pamphlet } from '@/lib/types/pamphlets';

export async function createPamphletAction(payload: {
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
}) {
  try {
    const pamphlet = await createPamphlet(payload);
    revalidatePath('/pamphlets');
    return { success: true, pamphlet, id: pamphlet.id };
  } catch (error) {
    console.error('Failed to create pamphlet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create e-pamphlet.',
    };
  }
}

export async function updatePamphletAction(
  id: string,
  updates: Partial<Pamphlet>
) {
  try {
    const pamphlet = await updatePamphlet(id, updates);
    revalidatePath('/pamphlets');
    revalidatePath(`/pamphlet-builder/${id}`);
    if (pamphlet.slug) {
      revalidatePath(`/p/${pamphlet.slug}`);
      revalidatePath(`/pamphlet/${id}`);
    }
    return { success: true, pamphlet };
  } catch (error) {
    console.error('Failed to update pamphlet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update e-pamphlet.',
    };
  }
}

export async function deletePamphletAction(id: string) {
  try {
    await deletePamphlet(id);
    revalidatePath('/pamphlets');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete pamphlet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete e-pamphlet.',
    };
  }
}

export async function trackPamphletViewAction(id: string) {
  try {
    await incrementPamphletViews(id);
    return { success: true };
  } catch (error) {
    console.warn('Failed to track pamphlet view:', error);
    return { success: false };
  }
}
