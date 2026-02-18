'use server';

import { createShortLink, deleteShortLink } from '@/lib/storage/short-links';
import { revalidatePath } from 'next/cache';

export type ActionState = {
    error?: string;
    success?: boolean;
};

export async function createShortLinkAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const slug = formData.get('slug') as string;
        const originalUrl = formData.get('originalUrl') as string;

        await createShortLink(slug, originalUrl);
        revalidatePath('/shortener');
        return { success: true };
    } catch (error) {
        console.error('Create short link error:', error);
        let message = 'Failed to create link';
        if (error instanceof Error) {
            if (error.message === 'Slug already exists') message = 'Short code (slug) is already taken';
            else message = error.message;
        }
        return { error: message };
    }
}

export async function deleteShortLinkAction(id: string) {
    try {
        await deleteShortLink(id);
        revalidatePath('/shortener');
        return { success: true };
    } catch (error) {
        console.error('Delete short link error:', error);
        return { error: 'Failed to delete link' };
    }
}
