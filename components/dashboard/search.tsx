'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

export function DashboardSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [term, setTerm] = useState(searchParams.get('q')?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applySearch = (nextTerm: string) => {
    if (isSubmitting) return; // Prevent overlapping requests

    const params = new URLSearchParams(searchParams);
    if (nextTerm) {
      params.set('q', nextTerm);
    } else {
      params.delete('q');
    }
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setIsSubmitting(true);
      try {
        const targetUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
        replace(targetUrl);
      } catch (error) {
        // Silently handle navigation errors
        console.debug('Navigation cancelled:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form
      className="relative w-full md:w-64"
      onSubmit={(e) => {
        e.preventDefault();
        if (isSubmitting) return;
        applySearch(term.trim());
      }}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search forms..."
        className="pl-9 h-10 bg-white"
        onChange={(e) => setTerm(e.target.value)}
        onBlur={() => {
          if (isSubmitting) return;
          applySearch(term.trim());
        }}
        value={term}
        disabled={isSubmitting}
      />
    </form>
  );
}
