import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingHeaderAuth } from '@/components/landing-header-auth';
import { LandingFooter } from '@/components/landing/landing-footer';
import {
    Award,
    ArrowRight,
    Mail,
    Paintbrush,
    ShieldCheck,
    QrCode,
    Layers,
    FileCheck,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Digital Certificates | KlikForm',
    description: 'Design, generate, and send automated e-certificates to participants. Built-in verification with unique serial numbers and QR codes.',
    alternates: {
        canonical: 'https://klikform.com/products/certificates',
    }
};

export default function CertificatesProductPage() {
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
                            <Award className="h-3.5 w-3.5" />
                            <span>Digital Certificate Engine</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-950 mb-6 [text-wrap:balance]">
                            Automated E-Certificates with Built-In QR Verification
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-9 max-w-2xl mx-auto [text-wrap:balance]">
                            Design accredited certificates on our precision visual canvas, connect them to your intake forms, and automatically deliver individualized PDF certificates to every attendee.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" className="h-11 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                                <Link href="/login?tab=signup">
                                    Create Your First Certificate
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
                                Precision Publishing Pipeline
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
                                From visual typography layout to cryptographically verifiable distribution.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Paintbrush className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Visual Canvas Studio</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Interactive canvas editor with corner drag handles, custom logo uploads, and mathematical auto-scaling font calculations.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Curated Template Library</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Reusable pre-built designs across Academic, Classic, Modern, and Minimalist aesthetic styles in A4 Landscape or Portrait.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Automated Email Dispatch</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Upon form submission or administrative approval, high-resolution PDFs are automatically emailed to participants with zero human intervention.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Deterministic Serial Numbers</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Unique serial numbers prevent forgery and allow institutions to maintain reliable, audit-ready compliance registries.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <QrCode className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">QR Code Verification</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Every certificate contains a QR badge linking to a public lookup portal, allowing third parties and employers to confirm authenticity instantly.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <FileCheck className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">300 DPI Vector PDF &amp; PNG</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Export print-ready documents with crisp vector text, embedded fonts, and optimal file compression for fast downloads.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Target Workflows */}
                <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200/80">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">Built For</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto font-sans">
                            {[
                                { title: 'Webinars & Seminars', desc: 'Auto-issue attendance certificates upon post-event check-in.' },
                                { title: 'Schools & Universities', desc: 'Academic credentials, co-curricular participation, and sports awards.' },
                                { title: 'Conferences & Summits', desc: 'Speaker appreciation and delegate accreditation certificates.' },
                                { title: 'Corporate Training', desc: 'Professional development credits and regulatory compliance records.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs text-left">
                                    <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
                            Start Automating Certificates Today
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 mb-8 font-normal leading-relaxed">
                            Configure your layout once, automate generation indefinitely.
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
