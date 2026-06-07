'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export function LandingHeaderAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setMounted(true);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMounted(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!mounted) {
    // Return a matching layout space placeholder to avoid Cumulative Layout Shift (CLS)
    return (
      <div className="hidden md:flex items-center gap-4 w-[160px] h-9" />
    );
  }

  return (
    <div className="hidden md:flex items-center gap-4">
      {user ? (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forms">Dashboard</Link>
        </Button>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login?tab=signup">Sign Up Free</Link>
          </Button>
        </>
      )}
    </div>
  );
}
