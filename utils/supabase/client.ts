import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read cookie from document.cookie
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
        },
        set(name: string, value: string, options: any) {
          // Write cookie to document.cookie with proper options
          let cookie = `${name}=${encodeURIComponent(value)}`;

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }
          if (options?.path) {
            cookie += `; path=${options.path}`;
          } else {
            cookie += '; path=/';
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`;
          } else {
            cookie += '; samesite=lax';
          }
          if (options?.secure) {
            cookie += '; secure';
          }

          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          // Remove cookie by setting max-age=0
          let cookie = `${name}=; max-age=0`;

          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }
          if (options?.path) {
            cookie += `; path=${options.path}`;
          } else {
            cookie += '; path=/';
          }

          document.cookie = cookie;
        },
      },
    }
  );
}
