import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KlikForm - Malaysia\'s #1 Online Forms & Automated Digital Certificates',
  description: 'Create registration forms, collect data to Google Sheets, and send automated e-certificates. Free, easy & fast for events, classes, and WhatsApp forms.',
  alternates: {
    canonical: 'https://klikform.com',
  }
};
import {
  CheckCircle2,
  FileSpreadsheet,
  QrCode,
  Zap,
  ShieldCheck,
  ArrowRight,
  Link as LinkIcon,
  Award,
  Facebook,
  Twitter,
  Instagram,
} from 'lucide-react';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingNavbar } from '@/components/landing-navbar';

export default async function LandingPage() {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/forms');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
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
                <Link href="/login">
                  Login
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login?tab=signup">Sign Up Free</Link>
              </Button>
            </div>
            <LandingMobileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-[#451263] via-[#9333ea] to-[#451263] animate-gradient-xy pb-4">
                Online Forms & <br className="hidden sm:inline" />
                Automated Digital Certificates
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Create registration forms, collect data directly to Google Sheets, and send e-certificates
                to participants automatically. Free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto" asChild>
                  <Link href="/login?tab=signup">
                    Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex justify-center items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> No Credit Card Required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Secure & Private Data
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-0 -z-10 h-full w-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-100/50 blur-3xl"></div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                One Platform, Multiple Uses
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                KlikForm simplifies your data management and document automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Google Sheets Integration</h3>
                <p className="text-gray-500 leading-relaxed">
                  Data from your forms flows directly into Google Sheets in real-time. Easy
                  to manage.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Digital E-Certificate Creator</h3>
                <p className="text-gray-500 leading-relaxed">
                  Design your own digital certificate. E-Certificates will be generated and emailed directly
                  to participants automatically.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                  <LinkIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">URL Shortener</h3>
                <p className="text-gray-500 leading-relaxed">
                  Shorten and track your links. Make URLs cleaner and more professional to
                  share.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Dynamic QR Code Generator</h3>
                <p className="text-gray-500 leading-relaxed">
                  Generate dynamic QR codes for forms, links, or files. Customizable designs
                  to match your brand.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-red-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Certificate Verification System</h3>
                <p className="text-gray-500 leading-relaxed">
                  Each E-Certificate comes with a unique serial number and a built-in QR code
                  to verify its authenticity.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-cyan-600">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Basic & Pro Automation</h3>
                <p className="text-gray-500 leading-relaxed">
                  Start free with premium features. Upgrade to Pro for unlimited forms, certificates,
                  links, and QR codes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-24 border-t border-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 mb-6">
                  Perfect for Various Organizations
                </h2>
                <div className="space-y-4">
                  {[
                    'Teachers & Schools - Attendance forms & student participation certificates',
                    'Event Organizers - Participant registration & QR tickets',
                    'HR & Companies - Leave, claim, & staff evaluation forms',
                    'Online Sellers - Product order forms (WhatsApp link)',
                    'Webinars & Courses - Automated E-certificates after sessions end',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <Link href="/login?tab=signup">Create Account Now</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                {/* Abstract Visual Representation */}
                <div className="aspect-square bg-gray-100 rounded-2xl p-8 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50"></div>
                  <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 transform rotate-[-2deg] mb-6 border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-full bg-gray-50 rounded border border-gray-100"></div>
                      <div className="h-8 w-full bg-gray-50 rounded border border-gray-100"></div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="h-8 w-20 bg-blue-600 rounded"></div>
                    </div>
                  </div>
                  <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 transform rotate-[2deg] border border-gray-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <div className="h-6 w-6 text-yellow-600">🏆</div>
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-[#0F172A] text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
              Start Managing Forms & Certificates Today
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
              Join thousands of users who have simplified their workflow with KlikForm.
              Free forever for basic features.
            </p>
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-white text-gray-900 hover:bg-gray-100"
              asChild
            >
              <Link href="/login?tab=signup">
                Create Free Account
              </Link>
            </Button>
            <p className="mt-4 text-sm text-gray-400">No credit card required.</p>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-16 text-gray-500">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">

            {/* Brand & Description */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col items-start text-left">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-6">
                <div className="relative h-8 w-8 rounded-lg overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="KlikForm Logo"
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
                <span className="text-gray-900">
                  <span className="text-primary">Klik</span>Form
                </span>
              </Link>
              <p className="text-sm text-gray-500 leading-relax max-w-sm mb-8">
                Malaysia's preferred form and document automation platform. Simplifying your daily data management.
              </p>

              {/* Social Links */}
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-gray-900 font-semibold mb-6">Products</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-600">
                <li><Link href="#features" className="hover:text-primary transition-colors">Online Forms</Link></li>
                <li><Link href="#features" className="hover:text-primary transition-colors">Digital Certificates</Link></li>
                <li><Link href="#features" className="hover:text-primary transition-colors">QR Generator</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing & Plans</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-semibold mb-6">Support</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-600">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-semibold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-600">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100 text-sm gap-4">
            <p>© {new Date().getFullYear()} KlikForm. All Rights Reserved.</p>
            <p className="flex items-center gap-1">Made with <span className="text-red-500">❤️</span> in Malaysia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
