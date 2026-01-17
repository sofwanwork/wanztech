'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

interface MobileMenuProps {
    profile: any;
}

export function MobileMenu({ profile }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <DashboardSidebar profile={profile} onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="KlikForm" className="h-8 w-8 rounded-lg" />
                    <span className="font-bold text-lg text-gray-900">KlikForm</span>
                </div>
            </div>
        </div>
    );
}
