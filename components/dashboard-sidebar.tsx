'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Settings, LogOut, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createFormAction } from '@/actions/form';
import { logoutAction } from '@/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
    profile: any; // Using any for simplicity here, ideally import Profile type
}

export function DashboardSidebar({ profile }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            title: 'Dashboard',
            href: '/',
            icon: LayoutDashboard,
            active: pathname === '/'
        },
        {
            title: 'Settings',
            href: '/settings',
            icon: Settings,
            active: pathname === '/settings'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-primary/20">
                        <img
                            src="/logo.png?v=3"
                            alt="KlikForm Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KlikForm</h1>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                <div className="mb-6">
                    <form action={async () => {
                        await createFormAction({});
                    }}>
                        <Button className="w-full justify-start bg-primary hover:bg-primary/90 shadow-md shadow-primary/20" size="lg">
                            <Plus className="mr-2 h-5 w-5" />
                            New Form
                        </Button>
                    </form>
                </div>

                <div className="space-y-1">
                    <p className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Menu</p>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className="block">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start h-11",
                                    item.active
                                        ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                                )}
                            >
                                <item.icon className={cn("mr-3 h-5 w-5", item.active ? "text-primary" : "text-gray-500")} />
                                {item.title}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'KF'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.full_name || profile?.username || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            Dashboard User
                        </p>
                    </div>
                </div>
                <form action={logoutAction}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 h-9">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </form>
            </div>
        </div>
    );
}
