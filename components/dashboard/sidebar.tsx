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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createFormAction } from '@/actions/forms';
import { logoutAction } from '@/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useLocalStorage from '@/hooks/use-local-storage';
import { useEffect, useState } from 'react';

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any; // Using any for simplicity here, ideally import Profile type
  onNavigate?: () => void; // Callback for mobile menu close
}

export function DashboardSidebar({ profile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  // Initialize with false (expanded) by default
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('sidebar-collapsed', false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
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
  ];

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
              KlikForm
            </h1>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center mb-2">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png?v=3" alt="KlikForm Logo" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 text-gray-400 hover:text-gray-600',
            isCollapsed && 'w-full mt-2 h-6'
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        <div className="mb-6 px-1">
          <form
            action={async () => {
              await createFormAction({});
            }}
          >
            <Button
              className={cn(
                'w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all',
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              )}
              size={isCollapsed ? 'icon' : 'lg'}
              title="New Form"
            >
              <Plus className={cn('h-5 w-5', !isCollapsed && 'mr-2')} />
              {!isCollapsed && 'New Form'}
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
            <Link key={item.href} href={item.href} className="block" onClick={onNavigate}>
              <Button
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
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    !isCollapsed && 'mr-3',
                    item.active ? 'text-primary' : 'text-gray-500'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Button>
            </Link>
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
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 h-9 transition-all',
              isCollapsed ? 'justify-center px-0' : 'justify-start'
            )}
            title="Log Out"
          >
            <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && 'Log Out'}
          </Button>
        </form>
      </div>
    </div>
  );
}
