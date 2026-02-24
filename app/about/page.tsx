import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Target, Users, Zap, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | KlikForm',
    description: 'Learn about KlikForm, our mission to simplify digital forms and certificates, and the team behind the platform.',
    alternates: {
        canonical: 'https://klikform.com/about',
    }
};

export default async function AboutPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignored Server Component cookie set error
                    }
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

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 lg:py-32 bg-gray-50">
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-30">
                    <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute left-[-10%] bottom-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#451263] via-[#9333ea] to-[#451263] animate-gradient-xy mb-6 pb-4">
                        Simplifying Data for Every Organization
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-10">
                        We believe managing registrations, feedback, and certificates should be automated, seamless, and completely stress-free.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Our Mission</h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                KlikForm was born out of a simple frustration: educators, event organizers, and businesses were spending countless hours manually transferring form data to spreadsheets and typing out individual certificates.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Our mission is to bridge the gap between data collection and execution. By providing real-time Google Sheets integration and robust automated e-certificate generation, we give our users their time back so they can focus on what truly matters—their people.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                                <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                    <Target className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Purpose Driven</h3>
                                <p className="text-sm text-gray-600">Built to solve real logistical headaches for administrators.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center mt-8">
                                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">User First</h3>
                                <p className="text-sm text-gray-600">Accessible workflows suitable for all technical skill levels.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Fast Execution</h3>
                                <p className="text-sm text-gray-600">Real-time syncing and instant automated email delivery.</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center mt-8">
                                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Reliable & Secure</h3>
                                <p className="text-sm text-gray-600">Data isolation and secure integrations you can trust.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-primary/5 border-t border-primary/10">
                <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
                        Ready to automate your workflow?
                    </h2>
                    <p className="text-lg text-gray-600 mb-10">
                        Join thousands of event organizers, educators, and businesses using KlikForm every day.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-12 px-8" asChild>
                            <Link href="/login?tab=signup">Get Started for Free</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                            <Link href="/pricing">View Pricing Plans</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-white py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center justify-center gap-2 opacity-80">
                        <div className="relative h-8 w-8">
                            <Image src="/logo.png" alt="KlikForm Logo" fill className="object-contain" sizes="32px" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">KlikForm</span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">© {new Date().getFullYear()} KlikForm. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
