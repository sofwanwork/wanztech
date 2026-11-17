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
                    <Button variant="ghost" size="icon" aria-label="Open Navigation Menu" className="rounded-md">
                        <Menu className="h-5 w-5 text-slate-700" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col h-full bg-white border-l border-slate-200 shadow-xl">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Main menu for KlikForm
                    </SheetDescription>

                    {/* Header */}
                    <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <div className="relative h-7 w-7 rounded-md overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="KlikForm Logo"
                                    fill
                                    className="object-contain"
                                    sizes="28px"
                                />
                            </div>
                            <span className="tracking-tight text-slate-900">
                                <span className="text-violet-900">Klik</span>Form
                            </span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto py-5 px-4">
                        <nav className="flex flex-col gap-1">
                            <p className="px-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Products</p>
                            
                            <Link
                                href="/products/forms"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <span>Online Forms</span>
                            </Link>

                            <Link
                                href="/products/certificates"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <Award className="h-4 w-4" />
                                </div>
                                <span>E-Certificate Studio</span>
                            </Link>

                            <Link
                                href="/products/bio"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>KlikBio (Link-in-Bio)</span>
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">NEW</span>
                                </div>
                            </Link>

                            <Link
                                href="/products/bulk-certificates"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Bulk Certificates</span>
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase">CSV → ZIP</span>
                                </div>
                            </Link>

                            <Link
                                href="/products/qr-codes"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <QrCode className="h-4 w-4" />
                                </div>
                                <span>Dynamic QR Codes</span>
                            </Link>

                            <Link
                                href="/products/shortener"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <LinkIcon className="h-4 w-4" />
                                </div>
                                <span>URL Shortener</span>
                            </Link>

                            <div className="border-t border-slate-200/80 my-3" />

                            <p className="px-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">General</p>

                            <Link
                                href="/pricing"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <span>Pricing &amp; Plans</span>
                            </Link>

                            <Link
                                href="/about"
                                className="flex items-center gap-3 p-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                                    <Users className="h-4 w-4" />
                                </div>
                                <span>About Us</span>
                            </Link>
                        </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-2">
                        <Button variant="outline" className="w-full justify-center h-10 text-sm font-medium border-slate-200 bg-white hover:bg-violet-50 hover:text-violet-900 text-slate-900 rounded-md" asChild>
                            <Link href="/login" onClick={() => setOpen(false)}>
                                <LogIn className="mr-2 h-4 w-4" /> Login
                            </Link>
                        </Button>
                        <Button className="w-full justify-center h-10 text-sm font-medium bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs" asChild>
                            <Link href="/login?tab=signup" onClick={() => setOpen(false)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Sign Up Free
                            </Link>
                        </Button>
                        <p className="text-[11px] text-center text-slate-400 pt-2 font-mono">
                            © {new Date().getFullYear()} KlikForm
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
