import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
    FileSpreadsheet,
    ArrowRight,
    CheckCircle2,
    Zap,
    Globe,
    Smartphone,
    Palette,
    BarChart3,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Online Forms | KlikForm',
    description: 'Create powerful online forms with real-time Google Sheets integration, custom fields, file uploads, and WhatsApp sharing. Free to start.',
    alternates: {
        canonical: 'https://klikform.com/products/forms',
    }
};

export default async function FormsProductPage() {
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
                <section className="relative overflow-hidden py-20 lg:py-32 bg-blue-50/50">
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-20">
                        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/30 blur-3xl" />
                        <div className="absolute left-[-10%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl" />
                    </div>
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
                            <FileSpreadsheet className="h-4 w-4" /> Online Forms
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-primary to-blue-700 animate-gradient-xy mb-6 pb-4">
                            Build Smart Forms That Work for You
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Create registration forms, feedback surveys, and order forms that automatically save every response to Google Sheets in real-time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-12 px-8" asChild>
                                <Link href="/login?tab=signup">Start Building for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Why Choose KlikForm?</h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything you need to collect, manage, and act on form data — without the complexity.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Real-Time Google Sheets Sync</h3>
                                <p className="text-gray-500 leading-relaxed">Every submission is instantly pushed to your Google Sheet. No manual exports, no CSV downloads — just live data.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                    <Palette className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Drag & Drop Builder</h3>
                                <p className="text-gray-500 leading-relaxed">Build forms visually with our intuitive builder. Text fields, dropdowns, file uploads, date pickers, and more — all with zero coding.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Mobile-First Design</h3>
                                <p className="text-gray-500 leading-relaxed">Every form looks beautiful on any device. Responsive layouts ensure your forms work perfectly on phones, tablets, and desktops.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                                    <Globe className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Shareable Anywhere</h3>
                                <p className="text-gray-500 leading-relaxed">Share forms via direct link, WhatsApp, QR code, or embed them on your website. Reach your audience wherever they are.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-red-600">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Automated Email Alerts</h3>
                                <p className="text-gray-500 leading-relaxed">Get instant email notifications every time someone submits your form. Never miss a response again.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-cyan-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Validation & Security</h3>
                                <p className="text-gray-500 leading-relaxed">Built-in field validation, rate limiting, and injection protection ensure your data is always clean and secure.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="py-16 md:py-24 bg-gray-50">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Perfect For</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                            {[
                                { title: 'Event Registration', desc: 'Collect participant details and auto-generate attendee lists.' },
                                { title: 'Order Forms', desc: 'Accept product orders with WhatsApp confirmation links.' },
                                { title: 'Feedback Surveys', desc: 'Gather reviews and ratings from customers or students.' },
                                { title: 'HR & Admin', desc: 'Leave applications, claims, and internal request forms.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-all">
                                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-primary/5 border-t border-primary/10">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Ready to build your first form?</h2>
                        <p className="text-lg text-gray-600 mb-10">Sign up in seconds and start collecting data instantly. No credit card required.</p>
                        <Button size="lg" className="h-12 px-8" asChild>
                            <Link href="/login?tab=signup">Get Started for Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white py-6 md:py-0">
                <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center gap-4 md:h-24">
                    <p className="text-sm text-gray-500">© {new Date().getFullYear()} KlikForm. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
