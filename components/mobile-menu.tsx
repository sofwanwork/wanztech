'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

interface MobileMenuProps {
  profile: { id?: string; username?: string; full_name?: string; avatar_url?: string } | undefined;
}

export function MobileMenu({ profile }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
      {/* Logo on the left */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="KlikForm" className="h-8 w-8 rounded-lg" />
        <span className="font-bold text-lg text-gray-900">KlikForm</span>
      </div>

      {/* Hamburger menu on the right */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation for KlikForm dashboard
          </SheetDescription>
          <DashboardSidebar profile={profile} isMobile={true} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
