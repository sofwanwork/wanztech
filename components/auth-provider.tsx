'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token !== undefined) {
        // handle token refresh or any other logic if needed
      }

      if (event === 'SIGNED_OUT') {
        router.refresh();
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    setIsMounting(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (isMounting) {
    // Optional: return loading state if needed, but for a top-level provider,
    // it might be better to just render children to avoid layout shift,
    // or render nothing if strict auth is required (but middleware handles that).
    // minimizing layout shift:
    return <>{children}</>;
  }

  return <>{children}</>;
}
