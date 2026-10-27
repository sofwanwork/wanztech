export const PRIMARY_ADMIN_EMAIL = 'sofwanjailani.work@gmail.com';

/**
 * Returns the list of authorized admin emails.
 * Always includes the primary admin email sofwanjailani.work@gmail.com.
 * Safe for use in Client Components, Edge Middleware, and Server Components.
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
 * Safe for use in Client Components, Edge Middleware, and Server Components.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getAdminEmails().includes(clean);
}
