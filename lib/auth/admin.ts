import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdmin } from './admin-shared';

export * from './admin-shared';

/**
 * Server-side guard to verify admin access.
 * If user is not authenticated or not a super admin, redirects to /forms.
 * Note: Only call from Server Components or Server Actions.
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
