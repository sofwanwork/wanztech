'use server';

import { saveQRCode, deleteQRCode } from '@/lib/storage/qr-codes';
import { revalidatePath } from 'next/cache';
import { QRSettings } from '@/lib/types/forms';

import { canCreateQRCode } from '@/lib/storage/subscription';

export async function createOrUpdateQRCode(
  id: string | undefined,
  title: string,
  content: string,
  settings: QRSettings
) {
  try {
    // Enforce limit only for NEW creations
    if (!id) {
      const limitCheck = await canCreateQRCode();
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.message || 'QR Code limit reached' };
      }
    }

    const newId = await saveQRCode({
      id,
      title,
      content,
      settings,
    });

    revalidatePath('/qr-builder');

    if (!id) {
      // redirect only if it's a new creation
      // return { success: true, id: newId, redirect: true };
      // Better to let client handle redirect if needed, or redirect here.
      // Redirecting here is fine for server actions used in forms.
    }

    return { success: true, id: newId };
  } catch (error) {
    console.error('Failed to save QR code:', error);
    return { success: false, error: 'Failed to save QR code' };
  }
}

export async function deleteQRCodeAction(id: string) {
  try {
    await deleteQRCode(id);
    revalidatePath('/qr-builder');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete QR code:', error);
    return { success: false, error: 'Failed to delete QR code' };
  }
}
