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
    CheckCircle2,
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
                        <LandingHeaderAuth />
                        <LandingMobileMenu />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden py-20 lg:py-32 bg-emerald-50/40">
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-25">
                        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-3xl" />
                        <div className="absolute left-[-10%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-teal-400/20 blur-3xl" />
                    </div>
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-emerald-200/60 shadow-xs">
                            <Sparkles className="h-4 w-4 text-emerald-600" /> KlikBio — Next-Generation Link-in-Bio
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 animate-gradient-xy mb-6 pb-4 [text-wrap:balance]">
                            One Smart Link For All Your Profiles, Social Media &amp; Forms
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto [text-wrap:balance]">
                            Turn your social media bio into a professional micro-landing page. Features 8 elegant themes, aesthetic background patterns, direct WhatsApp links, and instant real-time live preview.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" asChild>
                                <Link href="/login?tab=signup">Build Your KlikBio Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-8 border-slate-200 hover:bg-slate-50" asChild>
                                <Link href="/pricing">View Plans &amp; Pricing</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Key Features Bento */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
                                Everything You Need in a Single Bio Page
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Purpose-built for online merchants, event organizers, educators, and content creators.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 border border-emerald-100">
                                    <Palette className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">8 Premium Color Themes</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Choose from 8 curated themes: Emerald Luxe, Onyx Dark, Sunset Glow, Deep Ocean, Minimal Light, Cyber Neon, and more.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600 border border-teal-100">
                                    <Layers className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">8 Aesthetic Background Patterns</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Add a unique visual touch with Polka Dots, Topography Waves, Grid, Modern Stripes, and Digital Circuit patterns.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 border border-green-100">
                                    <MessageCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart WhatsApp Links</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Make it effortless for customers to chat with one click, complete with pre-filled greeting text.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 border border-blue-100">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Live Mobile Mockup Preview</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    See exactly how your bio page looks on mobile in real time as you edit profiles and arrange links.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 border border-purple-100">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">QR Code &amp; Share Dialog</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Every KlikBio page comes with a high-resolution printable QR code and a clean short link for easy sharing on social media.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600 border border-amber-100">
                                    <BarChart2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Click &amp; Visitor Analytics</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Track clicks for every individual link to discover which products or offers resonate most with your audience.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sesuai Untuk Siapa */}
                <section className="py-16 md:py-24 bg-slate-50/60 border-t border-slate-100">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
                                Tailored For Every Use Case
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                One link that unifies all your offerings across Instagram, TikTok, Facebook, and WhatsApp.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { title: 'Online Merchants & Sellers', desc: 'Showcase product catalogs, order forms, and instant WhatsApp chat links in a single bio.' },
                                { title: 'Teachers & Educators', desc: 'Organize teaching materials, class attendance forms, and student certificate lookup portals.' },
                                { title: 'Event & Function Organizers', desc: 'Share Waze/Google Maps directions, RSVP forms, and event itineraries effortlessly.' },
                                { title: 'Creators & Freelancers', desc: 'Showcase your latest portfolio, YouTube/TikTok channels, and consultation inquiry links.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-emerald-950 text-white relative overflow-hidden">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                            Create Your KlikBio Link Today
                        </h2>
                        <p className="text-lg text-emerald-100/90 mb-10 max-w-2xl mx-auto">
                            Sign up free in seconds. No credit card required.
                        </p>
                        <Button size="lg" className="h-12 px-8 bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-xl" asChild>
                            <Link href="/login?tab=signup">Get Started Free Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
