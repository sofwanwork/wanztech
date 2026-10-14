'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

interface DashboardShellProps {
  sidebar: React.ReactNode;
  mobileMenu: React.ReactNode;
  banner: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  sidebar,
  mobileMenu,
  banner,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  // Certificate builder studio routes require an immersive 100vw x 100vh canvas workspace
  const isStudioRoute =
    pathname.startsWith('/certificates/builder/') &&
    pathname !== '/certificates/builder';

  if (isStudioRoute) {
    return (
      <div className="h-screen w-screen max-w-full overflow-hidden bg-gray-100 flex flex-col min-w-0 min-h-0">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu - Shows hamburger on mobile */}
      {mobileMenu}

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col h-full z-20">
        {sidebar}
      </aside>

      {/* Main Content Area - Add top padding on mobile for fixed header */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full h-full relative scroll-smooth pt-16 md:pt-0">
        {banner}
        {children}
      </main>
    </div>
  );
}
