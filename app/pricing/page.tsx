import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Crown, Zap, Users, Check, HelpCircle } from "lucide-react";
import { PlanCard } from "@/components/pricing/plan-card";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingHeaderAuth } from "@/components/landing-header-auth";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PRO_PRICE } from "@/lib/constants/pricing";

export const metadata: Metadata = {
  title: "Plans & Pricing | KlikForm",
  description:
    "Choose the KlikForm plan that fits your workflow. Start for free or upgrade to Pro for unlimited forms, e-certificates, and automated responses.",
  alternates: {
    canonical: "https://klikform.com/pricing",
  },
};

const FAQS = [
  {
    q: "Can I use KlikForm for free forever?",
    a: "Yes. The Free plan is free indefinitely with 5 active forms and 3,000 responses per month, without requiring a credit card.",
  },
  {
    q: "How much does the Pro subscription cost?",
    a: `The Pro plan is ${PRO_PRICE.display}/month for full, unlimited access to all capabilities including unlimited forms, Canva-style e-cert studio, bulk CSV-to-ZIP generator, and complete removal of KlikForm branding. Cancel anytime.`,
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel your subscription at any time directly from your dashboard settings with no termination fees or lock-in contracts.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support FPX Online Banking across all major Malaysian banks through the official BCL.my payment infrastructure, as well as major credit and debit cards.",
  },
  {
    q: "Do generated digital certificates include verifiable QR codes?",
    a: "Yes. Every certificate includes a unique verification serial number and QR code that resolves directly against our public verification portal.",
  },
];

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "RM 0",
      period: "/ forever",
      description: "Ideal for individuals, educators, and starter projects",
      icon: <Users className="h-5 w-5" />,
      color: "bg-slate-100 text-slate-800 border-slate-200",
      features: [
        "5 active forms",
        "3,000 responses / month",
        "Real-time Google Sheets sync",
        "Basic e-cert studio (2 certs)",
        "Public e-cert verification portal",
        "5 Dynamic QR codes",
        "URL shortener & basic KlikBio",
        "PDPA compliance",
      ],
      notIncluded: [
        "Unlimited forms & responses",
        "Bulk CSV to ZIP certificate generator",
        "Google Drive file uploads",
        "Remove KlikForm branding",
        "Priority customer support",
      ],
      current: false,
    },
    {
      name: "Pro",
      price: PRO_PRICE.display,
      period: PRO_PRICE.period,
      periodDetail: PRO_PRICE.periodDetail,
      priceDetail: PRO_PRICE.priceDetail,
      description: "For professionals, educators, event organizers, and growing teams",
      icon: <Crown className="h-5 w-5" />,
      color: "bg-slate-100 text-slate-900 border-slate-300",
      features: [
        "Unlimited forms",
        "Unlimited responses",
        "All form field types",
        "Direct Google Drive file uploads",
        "Google Sheets sync & Formula Shield",
        "Full Canva-style e-certificate studio",
        "Unlimited bulk CSV to ZIP generator",
        "IC / Passport verification portal & valid QR codes",
        "Unlimited dynamic QR codes",
        "Unlimited KlikBio (all themes & patterns)",
        "Remove KlikForm branding",
        "Fast priority customer support",
      ],
      notIncluded: [],
      popular: true,
      current: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For educational institutions, government bodies, and large scale enterprises",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-slate-100 text-slate-800 border-slate-200",
      features: [
        "All features in Pro plan",
        "Team members & role management",
        "Custom domain support",
        "Advanced API & Webhooks access",
        "Dedicated account manager support",
        "Enterprise system integration",
        "99.9% uptime SLA guarantee",
      ],
      notIncluded: [],
      comingSoon: true,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans">
      {/* Sleek Minimalist Sticky Navbar */}
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

      {/* Main Pricing Body */}
      <main className="flex-1 py-16 md:py-24 bg-white relative">
        {/* Subtle background grid accent */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />

        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Pricing Plans
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
              Transparent Pricing with No Hidden Fees
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto mb-6 leading-relaxed [text-wrap:balance]">
              Start with our free tier today. Upgrade to Pro anytime for unlimited forms, e-certificates, and automated responses.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-900" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-900" />
                <span>Secure FPX / BCL payment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-slate-900" />
                <span>Instant activation</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 max-w-[1320px] mx-auto items-stretch mb-24">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} user={null} />
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto pt-12 border-t border-slate-200">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded mb-3">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Answers to Common Inquiries
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1.5"
                >
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{faq.q}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Unified Minimalist Footer */}
      <LandingFooter />
    </div>
  );
}
