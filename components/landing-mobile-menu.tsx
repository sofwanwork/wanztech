'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Sparkles, CreditCard, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

export function LandingMobileMenu() {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Menu" className="-mr-2">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col h-full bg-white border-l border-gray-100 shadow-2xl">
                    <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                    <SheetDescription className="sr-only">
                        Menu utama untuk KlikForm
                    </SheetDescription>

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="KlikForm Logo"
                                    fill
                                    className="object-contain"
                                    sizes="32px"
                                />
                            </div>
                            <span>
                                <span className="text-primary">Klik</span>Form
                            </span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto py-6 px-6">
                        <nav className="flex flex-col gap-2">
                            <Link
                                href="#features"
                                className="flex items-center gap-4 p-3 text-lg font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-10 w-10 rounded-lg bg-purple-100/50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                Ciri-ciri
                            </Link>
                            <Link
                                href="/pricing"
                                className="flex items-center gap-4 p-3 text-lg font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-10 w-10 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                Harga
                            </Link>
                        </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 space-y-3">
                        <Link href="/login" onClick={() => setOpen(false)} className="block w-full">
                            <Button variant="outline" className="w-full justify-center h-12 text-base font-medium border-gray-200 hover:bg-white hover:text-primary shadow-sm">
                                <LogIn className="mr-2 h-4 w-4" /> Log Masuk
                            </Button>
                        </Link>
                        <Link href="/login?tab=signup" onClick={() => setOpen(false)} className="block w-full">
                            <Button className="w-full justify-center h-12 text-base font-medium shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                <UserPlus className="mr-2 h-4 w-4" /> Daftar Percuma
                            </Button>
                        </Link>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            © {new Date().getFullYear()} KlikForm.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
