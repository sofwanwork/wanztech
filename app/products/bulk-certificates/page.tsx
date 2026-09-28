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
    CheckCircle2,
    Sparkles,
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
                <section className="relative overflow-hidden py-20 lg:py-32 bg-amber-50/40">
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-25">
                        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/20 blur-3xl" />
                        <div className="absolute left-[-10%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-orange-400/20 blur-3xl" />
                    </div>
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-amber-200/60 shadow-xs">
                            <Layers className="h-4 w-4 text-amber-600" /> Bulk Certificates — Fast &amp; Powerful
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 animate-gradient-xy mb-6 pb-4 [text-wrap:balance]">
                            Generate Hundreds of Digital Certificates from CSV to ZIP in Seconds
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto [text-wrap:balance]">
                            No more filling certificates one by one manually. Upload attendee rosters via CSV, map columns, and download hundreds of finished PDF or PNG certificates in a clean ZIP archive.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20" asChild>
                                <Link href="/login?tab=signup">Start Bulk Generation <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                                Smart Capabilities for Large-Scale Certificate Issuance
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Empowering schools, universities, training centers, and event organizers to save countless hours.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600 border border-amber-100">
                                    <FileSpreadsheet className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Effortless CSV File Import</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Upload CSV files directly from Excel or Google Sheets. Seamlessly processes hundreds to thousands of attendees without slowdowns.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-600 border border-orange-100">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Column Auto-Detection</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    The system automatically detects Participant Name, Identity / IC No., Date, and Program Title columns for instant mapping.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 border border-blue-100">
                                    <Download className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Ready-to-Download ZIP Archive</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    All participant certificates are generated and neatly packaged into a single ZIP file, systematically named by attendee.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 border border-purple-100">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Printable PDF &amp; HD PNG Formats</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Choose the right export format — high-resolution print-ready PDFs or crisp PNG images perfect for social media sharing.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 border border-emerald-100">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Security QR Codes &amp; Serial Numbers</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Every certificate generated can include a unique serial number and QR code for instant authentication on the public lookup portal.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-amber-200 transition-all">
                                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600 border border-rose-100">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Typography Auto-Scaling</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">
                                    Lengthy participant names or event titles automatically scale down in font size so certificate layouts remain balanced and elegant.
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
                                Built For Large-Scale Events &amp; Institutions
                            </h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                The ultimate solution for managing thousands of attendee e-certificates without manual overhead.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { title: 'Schools & Academic Institutions', desc: 'Generate achievement, extracurricular, and annual sports day certificates for all students in a flash.' },
                                { title: 'Webinar & Seminar Organizers', desc: 'Distribute hundreds of attendee participation certificates immediately after your program concludes.' },
                                { title: 'Corporate Training & HR', desc: 'Issue staff skill certification, safety compliance accreditations, and professional training completion certs.' },
                                { title: 'Sports & Community Events', desc: 'Finisher certificates for marathons, athletic tournaments, community activities, and NGOs.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center hover:shadow-md hover:-translate-y-1 transition-all">
                                    <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600">
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
                <section className="py-20 bg-amber-950 text-white relative overflow-hidden">
                    <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                            Ready to Automate Your Bulk Certificates?
                        </h2>
                        <p className="text-lg text-amber-100/90 mb-10 max-w-2xl mx-auto">
                            Save valuable hours for your team. Generate hundreds of professional e-certificates in just a few clicks.
                        </p>
                        <Button size="lg" className="h-12 px-8 bg-white text-amber-950 hover:bg-amber-50 font-bold shadow-xl" asChild>
                            <Link href="/login?tab=signup">Start Generating Bulk Certificates Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
