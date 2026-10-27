import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const PRIMARY_ADMIN_EMAIL = 'sofwanjailani.work@gmail.com';

/**
 * Returns the list of authorized admin emails.
 * Always includes the primary admin email sofwanjailani.work@gmail.com.
 */
export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : [];
  const set = new Set([PRIMARY_ADMIN_EMAIL.toLowerCase(), ...envEmails]);
  return Array.from(set);
}

/**
 * Checks whether the given email belongs to an authorized Super Admin.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getAdminEmails().includes(clean);
}

/**
 * Server-side guard to verify admin access.
 * If user is not authenticated or not a super admin, redirects to /forms.
 */
export async function verifyAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isSuperAdmin(user.email)) {
    redirect('/forms');
  }

  return user;
}
