'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  LogOut,
  Plus,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  QrCode,
  Link as LinkIcon,
  ClipboardList,
  ScrollText,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createFormAction } from '@/actions/forms';
import { logoutAction } from '@/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useLocalStorage from '@/hooks/use-local-storage';
import { useEffect, useRef, useState, useTransition } from 'react';

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any; // Using any for simplicity here, ideally import Profile type
  onNavigate?: () => void; // Callback for mobile menu close
  isMobile?: boolean;
}

export function DashboardSidebar({ profile, onNavigate, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  // Initialize with false (expanded) by default
  const [storedCollapsed, setStoredCollapsed] = useLocalStorage<boolean>(
    'sidebar-collapsed',
    false
  );
  const isCollapsed = isMobile ? false : storedCollapsed;
  const setIsCollapsed = setStoredCollapsed;

  const [mounted, setMounted] = useState(false);
  const navLockedRef = useRef(false);
  const [isCreating, startCreate] = useTransition();
  const [isLoggingOut, startLogout] = useTransition();

  // Prevent hydration mismatch
  useEffect(() => {
    // Set mounted to true on client side
    setMounted(true);
  }, []);

  useEffect(() => {
    navLockedRef.current = false;
  }, [pathname]);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/forms',
      icon: LayoutDashboard,
      active: pathname === '/forms',
    },
    {
      title: 'Responses',
      href: '/responses',
      icon: ClipboardList,
      active: pathname === '/responses',
    },
    {
      title: 'E-Cert',
      href: '/certificates',
      icon: Award,
      active: pathname === '/certificates' && !pathname.includes('/builder'),
    },
    {
      title: 'E-Cert Builder',
      href: '/certificates/builder',
      icon: FileText,
      active: pathname.startsWith('/certificates/builder'),
    },
    {
      title: 'QR Builder',
      href: '/qr-builder',
      icon: QrCode,
      active: pathname === '/qr-builder',
    },
    {
      title: 'URL Shortener',
      href: '/shortener',
      icon: LinkIcon,
      active: pathname === '/shortener',
    },
    {
      title: 'Bio Links',
      href: '/bio',
      icon: Sparkles,
      active: pathname.startsWith('/bio'),
    },
    {
      title: 'E-Pamphlet',
      href: '/pamphlets',
      icon: BookOpen,
      active: pathname.startsWith('/pamphlets') || pathname.startsWith('/pamphlet-builder'),
    },
    {
      title: 'Audit Log',
      href: '/audit',
      icon: ScrollText,
      active: pathname === '/audit',
    },
    ...(profile?.isAdmin
      ? [
          {
            title: 'Admin Panel',
            href: '/admin',
            icon: ShieldCheck,
            active: pathname.startsWith('/admin'),
          },
        ]
      : []),
  ];

  const [showArrow, setShowArrow] = useState(false);

  // Cycle between Logo and Arrow when collapsed
  useEffect(() => {
    if (!isCollapsed) {
      const timer = setTimeout(() => setShowArrow(false), 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setShowArrow((prev) => !prev);
    }, 3000); // Toggle every 3 seconds

    return () => clearInterval(interval);
  }, [isCollapsed]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
        {/* Skeleton/Loading state to prevent flicker */}
        <div className="p-6 border-b border-gray-100 h-[89px]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between h-[89px]">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden transition-all duration-300">
            <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden border border-violet-200/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png?v=3" alt="KlikForm Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
              <span className="text-violet-900">Klik</span>Form
            </h1>
          </div>
        )}

        {isCollapsed && (
          <div
            className="w-full flex justify-center mb-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Expand Sidebar"
          >
            <div className="relative h-10 w-10 rounded-md overflow-hidden border border-violet-200/80 flex items-center justify-center bg-white">
              {/* Show Arrow or Logo based on state */}
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-500 flex items-center justify-center',
                  showArrow ? 'opacity-100' : 'opacity-0'
                )}
              >
                <ChevronRight className="h-6 w-6 text-violet-900" />
              </div>
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-500',
                  showArrow ? 'opacity-0' : 'opacity-100'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png?v=3"
                  alt="KlikForm Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain">
        <div className="mb-4 px-1">
          <form
            action={() => {
              startCreate(async () => {
                await createFormAction({});
              });
            }}
          >
            <Button
              className={cn(
                'w-full bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs transition-colors font-medium',
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              )}
              size={isCollapsed ? 'icon' : 'lg'}
              title="New Form"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className={cn('h-5 w-5 animate-spin', !isCollapsed && 'mr-2')} />
              ) : (
                <Plus className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
              )}
              {!isCollapsed && (isCreating ? 'Creating...' : 'New Form')}
            </Button>
          </form>
        </div>

        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-300">
              Menu
            </p>
          )}
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'w-full h-10 mb-1 transition-colors rounded-md text-sm',
                isCollapsed ? 'justify-center px-0' : 'justify-start px-3',
                item.active
                  ? 'bg-violet-50 text-violet-900 font-semibold hover:bg-violet-100/70 hover:text-violet-950'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Link
                href={item.href}
                className={cn('flex items-center w-full', isCollapsed ? 'justify-center' : 'gap-3')}
                onClick={(e) => {
                  if (pathname === item.href) {
                    e.preventDefault();
                    return;
                  }
                  if (navLockedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  navLockedRef.current = true;
                  onNavigate?.();
                }}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    item.active ? 'text-violet-900' : 'text-slate-400'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 mb-2 px-2 py-1.5 rounded-md transition-colors hover:bg-slate-100 cursor-pointer',
            isCollapsed ? 'justify-center flex-col' : 'justify-start'
          )}
          title="View Profile"
        >
          <Avatar className="h-9 w-9 rounded-md border border-slate-200 shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} className="rounded-md" />
            <AvatarFallback className="rounded-md bg-violet-50 text-violet-900 text-xs font-semibold">
              {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'KF'}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.full_name || profile?.username || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">View Profile &amp; Settings</p>
            </div>
          )}
        </Link>
        <form
          action={() => {
            startLogout(async () => {
              await logoutAction();
            });
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 transition-colors rounded-md text-xs',
              isCollapsed ? 'justify-center px-0' : 'justify-start'
            )}
            title="Log Out"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className={cn('h-4 w-4 animate-spin', !isCollapsed && 'mr-2')} />
            ) : (
              <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            )}
            {!isCollapsed && (isLoggingOut ? 'Logging out...' : 'Log Out')}
          </Button>
        </form>
      </div>
    </div>
  );
}
