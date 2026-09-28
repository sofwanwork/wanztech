'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, CreditCard, LogIn, UserPlus, Users, FileSpreadsheet, Award, Link as LinkIcon, QrCode, Sparkles, Layers } from 'lucide-react';
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
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Main menu for KlikForm
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
                            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Products</p>
                            <Link
                                href="/products/forms"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-blue-50/80 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100/80 group-hover:text-blue-700 group-hover:scale-105 transition-all shrink-0">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <span>Online Forms</span>
                            </Link>
                            <Link
                                href="/products/certificates"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-purple-600 hover:bg-purple-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-purple-50/80 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:bg-purple-100/80 group-hover:text-purple-700 group-hover:scale-105 transition-all shrink-0">
                                    <Award className="h-4 w-4" />
                                </div>
                                <span>E-Certificate Studio</span>
                            </Link>
                            <Link
                                href="/products/bio"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-emerald-50/80 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100/80 group-hover:text-emerald-700 group-hover:scale-105 transition-all shrink-0">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>KlikBio (Link-in-Bio)</span>
                                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">NEW</span>
                                </div>
                            </Link>
                            <Link
                                href="/products/bulk-certificates"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-amber-600 hover:bg-amber-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-amber-50/80 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100/80 group-hover:text-amber-700 group-hover:scale-105 transition-all shrink-0">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Bulk Certificates (CSV → ZIP)</span>
                                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">HOT</span>
                                </div>
                            </Link>
                            <Link
                                href="/products/qr-codes"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-rose-50/80 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:bg-rose-100/80 group-hover:text-rose-700 group-hover:scale-105 transition-all shrink-0">
                                    <QrCode className="h-4 w-4" />
                                </div>
                                <span>Dynamic QR Codes</span>
                            </Link>
                            <Link
                                href="/products/shortener"
                                className="flex items-center gap-3.5 p-2.5 text-base font-semibold text-slate-800 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-9 w-9 rounded-lg bg-indigo-50/80 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100/80 group-hover:text-indigo-700 group-hover:scale-105 transition-all shrink-0">
                                    <LinkIcon className="h-4 w-4" />
                                </div>
                                <span>URL Shortener</span>
                            </Link>

                            <div className="border-t border-gray-100 my-2" />

                            <Link
                                href="/pricing"
                                className="flex items-center gap-4 p-3 text-lg font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-10 w-10 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                Pricing
                            </Link>
                            <Link
                                href="/about"
                                className="flex items-center gap-4 p-3 text-lg font-medium text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-10 w-10 rounded-lg bg-green-100/50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Users className="h-5 w-5" />
                                </div>
                                About Us
                            </Link>
                        </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 space-y-3">
                        <Button variant="outline" className="w-full justify-center h-12 text-base font-medium border-gray-200 hover:bg-white hover:text-primary shadow-sm" asChild>
                            <Link href="/login" onClick={() => setOpen(false)}>
                                <LogIn className="mr-2 h-4 w-4" /> Login
                            </Link>
                        </Button>
                        <Button className="w-full justify-center h-12 text-base font-medium shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" asChild>
                            <Link href="/login?tab=signup" onClick={() => setOpen(false)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Sign Up Free
                            </Link>
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            © {new Date().getFullYear()} KlikForm.
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
