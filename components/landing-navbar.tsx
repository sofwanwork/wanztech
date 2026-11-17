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
    badge?: string;
    badgeColor?: string;
}

function ProductItem({
    href,
    title,
    description,
    icon,
    badge,
    badgeColor = "bg-violet-50 text-violet-900 border-violet-200/80",
}: ProductItemProps) {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className="group flex flex-row items-start gap-3 p-2.5 rounded-md hover:bg-violet-50/40 transition-colors text-left outline-none border border-transparent hover:border-violet-100"
                >
                    <div className="w-8 h-8 rounded-md bg-violet-50 text-violet-900 border border-violet-200/60 flex items-center justify-center shrink-0 group-hover:bg-violet-900 group-hover:text-white group-hover:border-violet-900 transition-colors">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-violet-900 transition-colors">
                                {title}
                            </span>
                            {badge && (
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded border uppercase tracking-wider",
                                        badgeColor
                                    )}
                                >
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5 font-normal">
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
                <span className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-slate-600">Products</span>
                <span className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-slate-600">Pricing</span>
                <span className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-slate-600">About</span>
            </nav>
        );
    }

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-violet-50/60 hover:text-violet-900 data-[state=open]:bg-violet-50 data-[state=open]:text-violet-900 text-sm font-medium rounded-md transition-colors h-9 px-3.5">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[520px] md:w-[640px] lg:w-[680px] bg-white border border-slate-200/90 shadow-lg rounded-lg overflow-hidden p-0">
                            {/* Products Grid */}
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 sm:p-4 bg-white">
                                <ProductItem
                                    href="/products/forms"
                                    title="Online Forms"
                                    description="Smart forms with real-time Google Sheets sync, Formula Injection Shield & skip logic."
                                    icon={<FileSpreadsheet className="h-4 w-4" />}
                                />
                                <ProductItem
                                    href="/products/certificates"
                                    title="E-Certificate Studio"
                                    description="Direct drag-to-scale builder, 10+ curated templates & auto-scaling typography."
                                    icon={<Award className="h-4 w-4" />}
                                />
                                <ProductItem
                                    href="/products/bio"
                                    title="KlikBio (Link-in-Bio)"
                                    description="Clean bio-link micro-page with curated themes, background patterns & WhatsApp routing."
                                    icon={<Sparkles className="h-4 w-4" />}
                                    badge="NEW"
                                    badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                                />
                                <ProductItem
                                    href="/products/bulk-certificates"
                                    title="Bulk Certificates (CSV → ZIP)"
                                    description="Import participant CSV lists and generate hundreds of PDF/PNG certificates in seconds."
                                    icon={<Layers className="h-4 w-4" />}
                                    badge="FAST"
                                    badgeColor="bg-violet-50 text-violet-900 border-violet-200"
                                />
                                <ProductItem
                                    href="/products/qr-codes"
                                    title="Dynamic QR Codes"
                                    description="Generate customizable trackable QR codes with crisp vector export & fast scans."
                                    icon={<QrCode className="h-4 w-4" />}
                                />
                                <ProductItem
                                    href="/products/shortener"
                                    title="URL Shortener"
                                    description="Shorten, customize, and track your registration and campaign links with real-time metrics."
                                    icon={<LinkIcon className="h-4 w-4" />}
                                />
                            </ul>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/pricing" className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-50/60 hover:text-violet-900 text-slate-600">
                        Pricing
                    </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/about" className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-50/60 hover:text-violet-900 text-slate-600">
                        About
                    </Link>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
