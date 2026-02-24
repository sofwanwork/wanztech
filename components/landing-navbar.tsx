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
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { FileSpreadsheet, Award, Link as LinkIcon, QrCode } from 'lucide-react';

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { title: string; icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
                    {...props}
                >
                    <div className="flex items-center gap-2 text-sm font-medium leading-none">
                        {icon && <span className="text-primary/80">{icon}</span>}
                        {title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"

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
                    <NavigationMenuTrigger className="bg-transparent hover:bg-transparent text-sm font-medium">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white border border-gray-100 shadow-xl rounded-xl">
                            <ListItem
                                href="/products/forms"
                                title="Online Forms"
                                icon={<FileSpreadsheet className="h-4 w-4" />}
                            >
                                Create powerful forms that save directly to Google Sheets in real-time.
                            </ListItem>
                            <ListItem
                                href="/products/certificates"
                                title="Digital Certificates"
                                icon={<Award className="h-4 w-4" />}
                            >
                                Automate e-certificate generation and delivery to participants seamlessly.
                            </ListItem>
                            <ListItem
                                href="/products/shortener"
                                title="URL Shortener"
                                icon={<LinkIcon className="h-4 w-4" />}
                            >
                                Shorten, manage, and track your custom links efficiently.
                            </ListItem>
                            <ListItem
                                href="/products/qr-codes"
                                title="QR Code Generator"
                                icon={<QrCode className="h-4 w-4" />}
                            >
                                Create dynamic QR codes for easy access to your forms and links.
                            </ListItem>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/pricing" className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                        Pricing
                    </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <Link href="/about" className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                        About
                    </Link>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
