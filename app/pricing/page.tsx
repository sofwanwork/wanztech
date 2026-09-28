import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Crown, Zap, Users, CheckCircle2, HelpCircle } from "lucide-react";
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
    a: "Yes! The Free plan is free forever with 5 active forms and 3,000 responses per month, without requiring any credit card.",
  },
  {
    q: "How much does the Pro subscription cost?",
    a: `The Pro plan is ${PRO_PRICE.display}/month for full, unlimited access to all features including unlimited forms, Canva-style e-cert studio, bulk CSV-to-ZIP generator, and removal of KlikForm branding. You can cancel anytime.`,
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. You can cancel your subscription at any time directly from your dashboard with no cancellation fees or contract lock-in.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept online banking (FPX Online Banking) across all major Malaysian banks through the secure BCL.my official payment gateway.",
  },
  {
    q: "Do generated digital certificates include verifiable QR codes?",
    a: "Yes! Every e-certificate comes with a unique serial number and security QR code that can be verified instantly on our public verification portal.",
  },
];

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "RM 0",
      period: "/ forever",
      description: "Ideal for individuals, educators, and small starter projects",
      icon: <Users className="h-6 w-6" />,
      color: "bg-slate-100 text-slate-700 border-slate-200",
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
      description: "For professionals, educators, event organizers, and growing businesses",
      icon: <Crown className="h-6 w-6" />,
      color: "bg-amber-50 text-amber-700 border-amber-200",
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
      description: "For educational institutions, government agencies, and large enterprises",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-purple-50 text-purple-700 border-purple-200",
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
            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
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
              <span className="text-purple-600">Klik</span>Form
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
      <main className="flex-1 py-16 md:py-24 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 relative">
        {/* Subtle background grid accent */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />

        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
              Transparent Pricing with No Hidden Fees
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto mb-6 leading-relaxed">
              Start for free today. Upgrade to Pro anytime for unlimited forms, e-certificates, and automated responses.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Secure FPX / BCL payment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Instant activation</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid - Widened for spacious desktop layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 max-w-[1320px] mx-auto items-stretch mb-24">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} user={null} />
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto pt-12 border-t border-slate-200">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-3">
                <HelpCircle className="h-3.5 w-3.5" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Got Questions? We&apos;ve Got Answers.
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-2"
                >
                  <h3 className="text-base font-bold text-slate-900">{faq.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">{faq.a}</p>
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
