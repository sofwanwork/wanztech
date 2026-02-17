import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Let @supabase/ssr handle cookie storage automatically
  // The default implementation uses cookies, not localStorage
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
