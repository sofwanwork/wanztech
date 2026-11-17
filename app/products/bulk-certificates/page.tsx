import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingHeaderAuth } from '@/components/landing-header-auth';
import { LandingFooter } from '@/components/landing/landing-footer';
import {
    Layers,
    ArrowRight,
    FileSpreadsheet,
    Download,
    ShieldCheck,
    Check,
    FileText,
    Zap,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Bulk Certificates (CSV to ZIP) | KlikForm',
    description: 'Import attendee CSV files and export hundreds of high-resolution PDF or PNG certificates in a single ZIP file in seconds.',
    alternates: {
        canonical: 'https://klikform.com/products/bulk-certificates',
    }
};

export default function BulkCertificatesProductPage() {
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
                            <Layers className="h-3.5 w-3.5" />
                            <span>Batch Processing Engine</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-slate-950 mb-6 [text-wrap:balance]">
                            Compile Hundreds of Certificates from CSV to ZIP
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed mb-9 max-w-2xl mx-auto [text-wrap:balance]">
                            Upload your participant roster via CSV. KlikForm maps fields, compiles individual PDF or PNG documents client-side, and packages them into a clean, structured ZIP archive.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" className="h-11 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                                <Link href="/login?tab=signup">
                                    Start Bulk Generation
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
                                Architecture
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                                Scalable Batch Infrastructure
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
                                Empowering administrators to process large rosters in seconds without server timeouts.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Instant CSV Roster Ingestion</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Export directly from Excel, Google Sheets, or internal databases. Smoothly parses thousands of rows without crashing browser memory.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Zap className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Automatic Header Detection</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Smart column mapping automatically detects Name, Email, ID number, and Date headers to minimize setup friction.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Download className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Structured ZIP Compilation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    All generated files are cleanly compressed into a single ZIP archive, systematically indexed by participant name or identity code.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Vector PDF &amp; Raster PNG</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Choose the right export format: crisp 300 DPI vector PDFs for high-grade printing or clean PNG images for instant social sharing.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Batch Serial Stamps &amp; QR Codes</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Each compiled certificate receives an individual serial number and QR code verifiable on our public verification portal.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                <div className="h-9 w-9 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center mb-4 text-slate-800">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">Intelligent Font Scaling</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Long names or hyphenated honorifics automatically scale down in real-time, preventing awkward line overflows and clipping.
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
                                { title: 'Schools & Universities', desc: 'Graduation, annual sports day, and co-curricular awards for thousands of students.' },
                                { title: 'Webinars & Seminars', desc: 'Compile hundreds of attendee participation certs directly from post-event check-in sheets.' },
                                { title: 'Corporate Training', desc: 'Certifications of completion for regulatory, safety, and operational workshops.' },
                                { title: 'Sports & Community Runs', desc: 'Finisher accreditations for marathons, tournaments, and civic initiatives.' },
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
                            Ready to Automate Your Bulk Certificates?
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 mb-8 font-normal leading-relaxed">
                            Save valuable administrative hours. Generate hundreds of professional e-certificates in seconds.
                        </p>
                        <Button size="lg" className="h-10 px-6 rounded-md bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium shadow-xs" asChild>
                            <Link href="/login?tab=signup">
                                Start Generating Bulk Certificates
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
