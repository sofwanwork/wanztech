'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, ArrowDownAZ, ArrowUpAZ, Clock, History } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function DashboardFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const currentSort = searchParams.get('sort') || 'newest';
  const [open, setOpen] = useState(false);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'newest') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    const newSearch = params.toString();
    replace(newSearch ? `${pathname}?${newSearch}` : pathname);
    setOpen(false);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'oldest', label: 'Oldest First', icon: History },
    { value: 'az', label: 'Name (A-Z)', icon: ArrowDownAZ },
    { value: 'za', label: 'Name (Z-A)', icon: ArrowUpAZ },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sort By</div>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left',
                currentSort === option.value && 'bg-accent/50 text-accent-foreground font-medium'
              )}
            >
              <option.icon className="h-4 w-4 opacity-70" />
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
