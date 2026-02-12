import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/builder',
    '/settings',
    '/certificates',
    '/qr-builder',
];

// Routes that are always public
const publicRoutes = [
    '/login',
    '/form',
    '/s',
    '/check',
    '/verify',
    '/api',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Skip static files and images
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if route requires authentication
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

    if (!isProtected) {
        return NextResponse.next();
    }

    // Create Supabase client for middleware
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Check authentication - handle refresh token errors gracefully
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        // If there's a refresh token error, clear all Supabase auth cookies
        // so the user can log in fresh without recurring errors
        if (error?.message?.includes('Refresh Token') || error?.code === 'session_not_found') {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            const redirectResponse = NextResponse.redirect(loginUrl);

            // Clear all Supabase auth cookies to prevent stale token loops
            request.cookies.getAll().forEach(cookie => {
                if (cookie.name.startsWith('sb-')) {
                    redirectResponse.cookies.delete(cookie.name);
                }
            });

            return redirectResponse;
        }

        // Normal case: user not authenticated, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
