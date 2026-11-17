import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingHeaderAuth } from '@/components/landing-header-auth';
import { LandingFooter } from '@/components/landing/landing-footer';
import {
    Link as LinkIcon,
    ArrowRight,
    BarChart3,
    MousePointerClick,
    Share2,
    Shield,
    Gauge,
    Pencil,
    Check,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'URL Shortener | KlikForm',
    description: 'Shorten, customize, and track your links with KlikForm. Clean, branded short URLs with click analytics.',
    alternates: {
        canonical: 'https://klikform.com/products/shortener',
    }
};

export default function ShortenerProductPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
                <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="relative h-8 w-8 rounded-md overflow-hidden">
                            <Image src="/logo.png" alt="KlikForm Logo" fill className="object-contain" sizes="32px" priority />
                        </div>
                        <span className="tracking-tight text-slate-900"><span className="text-violet-900">Klik</span>Form</span>
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

            <main className="flex-1">
                {/* Hero */}
                <section className="relative py-20 lg:py-28 bg-white border-b border-slate-200/80">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded text-xs font-mono font-medium mb-6">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span>Link Infrastructure</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-950 mb-6 [text-wrap:balance]">
                            Branded Short URLs with Real-Time Click Analytics
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-9 max-w-2xl mx-auto [text-wrap:balance]">
                            Convert unwieldy database and form links into clean, memorable short URLs. Monitor engagement telemetry with zero invasive third-party ad tracking.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" className="h-11 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                                <Link href="/login?tab=signup">
                                    Start Shortening for Free
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-16 md:py-24 border-b border-slate-200/80">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-14">
                            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Capabilities
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                                Precision Link Routing
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
                                Unified routing infrastructure natively integrated with your forms and certificates.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Gauge className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Instant Slug Provisioning</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Paste any target URL and generate a fast, lightweight redirect in milliseconds.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Pencil className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Custom Branded Slugs</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Create clean, memorable vanity slugs (e.g. `klikform.com/s/masterclass-2026`) for promotional campaigns.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Visitor Click Analytics</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Track click volume and timestamp distributions to evaluate marketing outreach channels.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Share2 className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">One-Click Clipboard &amp; QR</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Every shortened link immediately generates a matching high-resolution QR code for physical distribution.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Open-Redirect Shield</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Strict protocol validation ensures links cannot be weaponized for malicious open-redirect exploits.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <MousePointerClick className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Centralized Dashboard</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Manage, re-target, and archive all your links from a single, organized administrative table.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Target Workflows */}
                <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200/80">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">Target Workflows</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto font-sans">
                            {[
                                { title: 'SMS & WhatsApp Campaigns', desc: 'Short, clean URLs that conserve message character budgets.' },
                                { title: 'Conference Badges', desc: 'Memorable vanity links printed onto lanyards and materials.' },
                                { title: 'Social Media Bio Links', desc: 'Clean slugs for YouTube descriptions, Instagram, and LinkedIn.' },
                                { title: 'Document Distribution', desc: 'Direct access to cloud slide decks, syllabi, and schedules.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs text-left">
                                    <div className="h-8 w-8 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-3 text-slate-900">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-slate-950 text-white">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4 [text-wrap:balance]">
                            Streamline Your Links Today
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 mb-8 font-normal leading-relaxed">
                            Create clean, trackable short URLs for free. No credit card required.
                        </p>
                        <Button size="lg" className="h-10 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                            <Link href="/login?tab=signup">
                                Get Started Free
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
