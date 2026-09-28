"use client";

import * as React from 'react';
import Link from 'next/link';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
    FileSpreadsheet,
    Award,
    Sparkles,
    Layers,
    QrCode,
    Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductItemProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconColor: string;
    iconHoverColor: string;
    titleHoverColor: string;
    hoverBgColor?: string;
    badge?: string;
    badgeColor?: string;
}

function ProductItem({
    href,
    title,
    description,
    icon,
    iconColor,
    iconHoverColor,
    titleHoverColor,
    hoverBgColor = "hover:bg-slate-50/80",
    badge,
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/60",
}: ProductItemProps) {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className={cn(
                        "group flex flex-row items-start gap-3.5 p-3 rounded-2xl transition-all duration-200 text-left outline-none",
                        hoverBgColor
                    )}
                >
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 shadow-xs",
                            iconColor,
                            iconHoverColor
                        )}
                    >
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-bold text-slate-900 transition-colors duration-200", titleHoverColor)}>
                                {title}
                            </span>
                            {badge && (
                                <span
                                    className={cn(
                                        "px-1.5 py-0.2 text-[9px] font-extrabold rounded-full border uppercase tracking-wider",
                                        badgeColor
                                    )}
                                >
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1 font-normal group-hover:text-slate-600 transition-colors">
                            {description}
                        </p>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}

export function LandingNavbar() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <nav className="flex items-center gap-1">
                <span className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium">Products</span>
                <span className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium">Pricing</span>
                <span className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium">About</span>
            </nav>
        );
    }

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-slate-100/70 hover:text-purple-600 data-[state=open]:bg-purple-50 data-[state=open]:text-purple-700 text-sm font-semibold rounded-xl transition-colors">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[520px] md:w-[680px] lg:w-[720px] bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)] rounded-3xl overflow-hidden p-0">
                            {/* 6 Products Grid */}
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-4 sm:p-5">
                                <ProductItem
                                    href="/products/forms"
                                    title="Online Forms"
                                    description="Smart forms with real-time Google Sheets sync, Formula Injection Shield & skip logic."
                                    icon={<FileSpreadsheet className="h-5 w-5" />}
                                    iconColor="bg-blue-50/80 text-blue-600 border-blue-100/80"
                                    iconHoverColor="group-hover:bg-blue-100/80 group-hover:text-blue-700 group-hover:scale-105 group-hover:border-blue-200"
                                    titleHoverColor="group-hover:text-blue-600"
                                    hoverBgColor="hover:bg-blue-50/40"
                                />
                                <ProductItem
                                    href="/products/certificates"
                                    title="E-Certificate Studio"
                                    description="Canva-style drag-to-scale builder, 10+ professional templates & auto-scaling typography."
                                    icon={<Award className="h-5 w-5" />}
                                    iconColor="bg-purple-50/80 text-purple-600 border-purple-100/80"
                                    iconHoverColor="group-hover:bg-purple-100/80 group-hover:text-purple-700 group-hover:scale-105 group-hover:border-purple-200"
                                    titleHoverColor="group-hover:text-purple-600"
                                    hoverBgColor="hover:bg-purple-50/40"
                                />
                                <ProductItem
                                    href="/products/bio"
                                    title="KlikBio (Link-in-Bio)"
                                    description="Personal bio-link micro-page with 8 themes, background patterns & direct WhatsApp link."
                                    icon={<Sparkles className="h-5 w-5" />}
                                    iconColor="bg-emerald-50/80 text-emerald-600 border-emerald-100/80"
                                    iconHoverColor="group-hover:bg-emerald-100/80 group-hover:text-emerald-700 group-hover:scale-105 group-hover:border-emerald-200"
                                    titleHoverColor="group-hover:text-emerald-600"
                                    hoverBgColor="hover:bg-emerald-50/40"
                                    badge="NEW"
                                    badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                />
                                <ProductItem
                                    href="/products/bulk-certificates"
                                    title="Bulk Certificates (CSV → ZIP)"
                                    description="Import participant CSV list and generate hundreds of PDF/PNG certificates in seconds."
                                    icon={<Layers className="h-5 w-5" />}
                                    iconColor="bg-amber-50/80 text-amber-600 border-amber-100/80"
                                    iconHoverColor="group-hover:bg-amber-100/80 group-hover:text-amber-700 group-hover:scale-105 group-hover:border-amber-200"
                                    titleHoverColor="group-hover:text-amber-600"
                                    hoverBgColor="hover:bg-amber-50/40"
                                    badge="HOT"
                                    badgeColor="bg-amber-50 text-amber-700 border-amber-200/80"
                                />
                                <ProductItem
                                    href="/products/qr-codes"
                                    title="Dynamic QR Codes"
                                    description="Generate custom trackable QR codes with official logo, high resolution & fast scans."
                                    icon={<QrCode className="h-5 w-5" />}
                                    iconColor="bg-rose-50/80 text-rose-600 border-rose-100/80"
                                    iconHoverColor="group-hover:bg-rose-100/70 group-hover:text-rose-700 group-hover:scale-105 group-hover:border-rose-200"
                                    titleHoverColor="group-hover:text-rose-600"
                                    hoverBgColor="hover:bg-rose-50/40"
                                />
                                <ProductItem
                                    href="/products/shortener"
                                    title="URL Shortener"
                                    description="Shorten, customize, and track your registration links with detailed analytics."
                                    icon={<LinkIcon className="h-5 w-5" />}
                                    iconColor="bg-indigo-50/80 text-indigo-600 border-indigo-100/80"
                                    iconHoverColor="group-hover:bg-indigo-100/70 group-hover:text-indigo-700 group-hover:scale-105 group-hover:border-indigo-200"
                                    titleHoverColor="group-hover:text-indigo-600"
                                    hoverBgColor="hover:bg-indigo-50/40"
                                />
                            </ul>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/pricing" className="inline-flex h-9 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-100/70 hover:text-purple-600 text-slate-700">
                        Pricing
                    </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/about" className="inline-flex h-9 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-100/70 hover:text-purple-600 text-slate-700">
                        About
                    </Link>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

