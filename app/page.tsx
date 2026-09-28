import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { LandingHeaderAuth } from "@/components/landing-header-auth";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeaturesBento } from "@/components/landing/landing-features-bento";
import { LandingShowcase } from "@/components/landing/landing-showcase";
import { LandingUseCases } from "@/components/landing/landing-use-cases";
import { LandingComparison } from "@/components/landing/landing-comparison";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "KlikForm - Platform Automasi Borang Pintar & E-Sijil No. 1 Malaysia",
  description:
    "Bina borang pendaftaran, selaraskan data ke Google Sheets secara masa nyata, dan jana e-sijil digital automatik (Canva-style) dengan sistem verifikasi IC dan kod QR. Percuma & pantas.",
  alternates: {
    canonical: "https://klikform.com",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
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

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Minimalist Hero with Framer Motion & Interactive Mockup */}
        <LandingHero />

        {/* 2. Modern 7-Card Bento Grid with Current Features */}
        <LandingFeaturesBento />

        {/* 3. Deep-Dive Interactive Product Showcase */}
        <LandingShowcase />

        {/* 4. Malaysian Target Use Cases (Schools, Events, Sellers, HR) */}
        <LandingUseCases />

        {/* 5. Minimalist Comparison (Why KlikForm?) */}
        <LandingComparison />

        {/* 6. High-Contrast Call to Action */}
        <LandingCta />
      </main>

      {/* 7. Clean Minimalist Footer */}
      <LandingFooter />
    </div>
  );
}
