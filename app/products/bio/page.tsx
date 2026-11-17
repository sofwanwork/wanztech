import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingHeaderAuth } from '@/components/landing-header-auth';
import { LandingFooter } from '@/components/landing/landing-footer';
import {
    Sparkles,
    ArrowRight,
    Smartphone,
    Palette,
    QrCode,
    BarChart2,
    MessageCircle,
    Check,
    Layers,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'KlikBio — Professional Link-in-Bio & Smart Profile | KlikForm',
    description: 'Build a personal profile micro-landing page with 8 color themes, aesthetic background patterns, direct WhatsApp chat links, and KlikForm integration.',
    alternates: {
        canonical: 'https://klikform.com/products/bio',
    }
};

export default function BioProductPage() {
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
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Link-in-Bio Architecture</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-950 mb-6 [text-wrap:balance]">
                            One Unified Profile Link for Your Audience
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-9 max-w-2xl mx-auto [text-wrap:balance]">
                            Turn your social bio into a professional micro-page. Includes 8 curated themes, background patterns, direct WhatsApp routing, and real-time live preview.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" className="h-11 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                                <Link href="/login?tab=signup">
                                    Build Your KlikBio Free
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-11 px-6 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium" asChild>
                                <Link href="/pricing">View Plans &amp; Pricing</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Key Features Bento */}
                <section className="py-16 md:py-24 border-b border-slate-200/80">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-14">
                            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Features
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                                Modern Bio Profile Capabilities
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
                                Purpose-built for merchants, event managers, educators, and creators.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Palette className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">8 Curated Color Palettes</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Switch effortlessly between Minimal Light, Onyx Dark, Emerald Slate, Deep Ocean, and Warm Paper styles.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Geometric Background Patterns</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Enhance visual texture with subtle Dot Matrix, Clean Grids, Topography Waves, and Minimal Stripes.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Direct WhatsApp Routing</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Allow prospects and customers to initiate chats with one click, pre-populated with customized inquiry messages.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Smartphone className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Mobile Sandbox</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Preview your mobile bio exactly as your followers will see it while rearranging links and editing bios.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <QrCode className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">QR Code &amp; Short URL</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Every bio page includes a crisp vector QR code ready for physical event posters, business cards, and banners.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <BarChart2 className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Link Click Metrics</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Track clicks across every link to identify which products, event registrations, or resources drive engagement.
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
                                { title: 'Merchants & Brands', desc: 'Centralize product catalogs, intake forms, and direct WhatsApp ordering.' },
                                { title: 'Teachers & Trainers', desc: 'Organize course handouts, attendance check-ins, and certificate portals.' },
                                { title: 'Event Organizers', desc: 'Share venue directions, speaker lineups, and ticket registration forms.' },
                                { title: 'Creators & Agencies', desc: 'Showcase portfolios, media kits, and direct client consultation links.' },
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
                            Build Your Free KlikBio Profile
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 mb-8 font-normal leading-relaxed">
                            Publish your personalized link in under sixty seconds.
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
