import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { Target, Users, Zap, Shield, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import { LandingHeaderAuth } from '@/components/landing-header-auth';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
    title: 'About Us | KlikForm',
    description: 'Learn about KlikForm, our mission to simplify digital forms and certificates, and the team behind the platform.',
    alternates: {
        canonical: 'https://klikform.com/about',
    }
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
                <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="relative h-8 w-8 rounded-md overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="KlikForm Logo"
                                fill
                                className="object-contain"
                                sizes="32px"
                                priority
                            />
                        </div>
                        <span className="tracking-tight text-slate-900">
                            <span className="text-violet-900">Klik</span>Form
                        </span>
                    </Link>
                    <div className="hidden md:flex flex-1 justify-center ml-8">
                        <LandingNavbar />
                    </div>
                    <div className="flex items-center gap-3">
                        <LandingHeaderAuth />
                        <LandingMobileMenu />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 lg:py-28 bg-white border-b border-slate-200/80">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />

                <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-3xl">
                    <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Our Mission
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-950 mb-6 [text-wrap:balance]">
                        Engineering Reliable Software for Modern Intake
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal [text-wrap:balance]">
                        We believe collecting participant registrations, syncing spreadsheets, and issuing accredited certificates should be seamless, automated, and zero-stress.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 md:py-24 border-b border-slate-200/80">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">
                        <div>
                            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Background
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
                                Why KlikForm Was Built
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4 font-normal">
                                KlikForm began with a common frustration: administrators, event organizers, and teachers were spending hundreds of hours manually copying form responses into spreadsheets and designing certificates one by one.
                            </p>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                                Our goal is to unify data collection with document generation. By combining continuous Google Sheets synchronization with an in-browser certificate publishing engine, we help teams focus on delivering their programs instead of managing repetitive administrative paperwork.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col shadow-2xs">
                                <div className="h-9 w-9 bg-slate-100 text-slate-800 border border-slate-200 rounded-md flex items-center justify-center mb-3">
                                    <Target className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Purpose-Built</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Engineered specifically to solve registration and certification logistics.</p>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col shadow-2xs">
                                <div className="h-9 w-9 bg-slate-100 text-slate-800 border border-slate-200 rounded-md flex items-center justify-center mb-3">
                                    <Users className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Accessible</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Clean, straightforward workflows suitable for technical and non-technical teams.</p>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col shadow-2xs">
                                <div className="h-9 w-9 bg-slate-100 text-slate-800 border border-slate-200 rounded-md flex items-center justify-center mb-3">
                                    <Zap className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Sub-Second Sync</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Continuous Google Sheets data pipeline with zero manual polling.</p>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col shadow-2xs">
                                <div className="h-9 w-9 bg-slate-100 text-slate-800 border border-slate-200 rounded-md flex items-center justify-center mb-3">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Privacy First</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">Formula injection sanitization and PDPA compliance built in.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-slate-50 border-b border-slate-200/80">
                <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
                        Ready to Simplify Your Intake Workflow?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mb-8 font-normal leading-relaxed">
                        Join event organizers, educators, and businesses who rely on KlikForm daily.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button size="lg" className="h-10 px-6 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium" asChild>
                            <Link href="/login?tab=signup">
                                Get Started for Free
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-10 px-6 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium" asChild>
                            <Link href="/pricing">View Pricing Plans</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <LandingFooter />
        </div>
    );
}
