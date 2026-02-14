'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Plus,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
  QrCode,
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
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
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
            <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png?v=3" alt="KlikForm Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
              <span className="text-primary">Klik</span>Form
            </h1>
          </div>
        )}

        {isCollapsed && (
          <div
            className="w-full flex justify-center mb-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Expand Sidebar"
          >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-primary/20 flex items-center justify-center bg-white">
              {/* Show Arrow or Logo based on state */}
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-500 flex items-center justify-center',
                  showArrow ? 'opacity-100' : 'opacity-0'
                )}
              >
                <ChevronRight className="h-6 w-6 text-primary" />
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
            className="hidden md:flex h-6 w-6 text-gray-400 hover:text-gray-600"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        <div className="mb-6 px-1">
          <form
            action={() => {
              startCreate(async () => {
                await createFormAction({});
              });
            }}
          >
            <Button
              className={cn(
                'w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all',
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
                'w-full h-10 mb-1 transition-all duration-200',
                isCollapsed ? 'justify-center px-0' : 'justify-start px-3',
                item.active
                  ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
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
                    'h-5 w-5 flex-shrink-0',
                    item.active ? 'text-primary' : 'text-gray-500'
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
        <div
          className={cn(
            'flex items-center gap-3 mb-2 px-1 transition-all',
            isCollapsed ? 'justify-center flex-col' : 'justify-start'
          )}
        >
          <Avatar className="h-9 w-9 border border-gray-200 shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'KF'}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || profile?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">Dashboard User</p>
            </div>
          )}
        </div>
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
              'w-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 h-9 transition-all',
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
