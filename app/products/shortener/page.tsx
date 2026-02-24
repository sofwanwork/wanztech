import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
    Link as LinkIcon,
    ArrowRight,
    BarChart3,
    MousePointerClick,
    Share2,
    Shield,
    Gauge,
    Pencil,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'URL Shortener | KlikForm',
    description: 'Shorten, customize, and track your links with KlikForm. Clean, branded short URLs with click analytics.',
    alternates: {
        canonical: 'https://klikform.com/products/shortener',
    }
};

export default async function ShortenerProductPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden">
                            <Image src="/logo.png" alt="KlikForm Logo" fill className="object-contain" sizes="32px" />
                        </div>
                        <span><span className="text-primary">Klik</span>Form</span>
                    </Link>
                    <div className="hidden md:flex flex-1 justify-center ml-8">
                        <LandingNavbar />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={user ? '/forms' : '/login'}>{user ? 'Dashboard' : 'Login'}</Link>
                            </Button>
                            {!user && (
                                <Button size="sm" asChild>
                                    <Link href="/login?tab=signup">Sign Up Free</Link>
                                </Button>
                            )}
                        </div>
                        <LandingMobileMenu />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden py-20 lg:py-32 bg-orange-50/50">
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-20">
                        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/30 blur-3xl" />
                        <div className="absolute left-[-10%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-red-400/20 blur-3xl" />
                    </div>
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
                            <LinkIcon className="h-4 w-4" /> URL Shortener
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 animate-gradient-xy mb-6 pb-4">
                            Short Links, Big Impact
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Turn long, messy URLs into clean, professional short links. Track clicks and manage all your links from one dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-12 px-8" asChild>
                                <Link href="/login?tab=signup">Start Shortening for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">More Than Just Short Links</h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">A complete link management tool built right into KlikForm.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                                    <Gauge className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Instant Shortening</h3>
                                <p className="text-gray-500 leading-relaxed">Paste any URL and get a short, clean link instantly. Works with any website, form, or document link.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                    <Pencil className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Custom Short Codes</h3>
                                <p className="text-gray-500 leading-relaxed">Choose your own custom slug for branded, memorable links. For example: klikform.com/s/my-event</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Click Tracking</h3>
                                <p className="text-gray-500 leading-relaxed">Monitor how many clicks each link receives. Understand which campaigns and channels drive the most traffic.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                    <Share2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Easy Sharing</h3>
                                <p className="text-gray-500 leading-relaxed">Copy short links with one click. Perfect for WhatsApp messages, social media bios, and printed materials.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-red-600">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Secure Redirects</h3>
                                <p className="text-gray-500 leading-relaxed">All short links use secure HTTPS redirects. Your visitors are always safe and protected.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-cyan-600">
                                    <MousePointerClick className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Link Management Dashboard</h3>
                                <p className="text-gray-500 leading-relaxed">View, edit, and organize all your short links from a centralized dashboard. Search and filter with ease.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-primary/5 border-t border-primary/10">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Ready to clean up your links?</h2>
                        <p className="text-lg text-gray-600 mb-10">Create professional short links for free. No credit card required.</p>
                        <Button size="lg" className="h-12 px-8" asChild>
                            <Link href="/login?tab=signup">Get Started for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="border-t bg-white py-6 md:py-0">
                <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center gap-4 md:h-24">
                    <p className="text-sm text-gray-500">© {new Date().getFullYear()} KlikForm. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
