import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-16 text-slate-500 text-sm font-sans">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12 mb-14">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="relative h-7 w-7 rounded-lg overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="KlikForm Logo"
                  fill
                  className="object-contain"
                  sizes="28px"
                />
              </div>
              <span className="text-slate-900 tracking-tight">
                <span className="text-purple-600">Klik</span>Form
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6 font-normal">
              Next-generation online form automation and digital e-certificate issuance platform. Empowering educators, event organizers, and businesses to manage data professionally.
            </p>
            <div className="text-xs text-slate-400">
              Supports real-time Google Sheets sync, PDPA compliance, and IC/QR verification.
            </div>
          </div>

          {/* Column 1: Products */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Products
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/products/forms" className="hover:text-purple-600 transition-colors">
                  Online Forms
                </Link>
              </li>
              <li>
                <Link href="/products/certificates" className="hover:text-purple-600 transition-colors">
                  E-Certificate Studio
                </Link>
              </li>
              <li>
                <Link href="/products/bulk-certificates" className="hover:text-purple-600 transition-colors">
                  Bulk Certificates (CSV to ZIP)
                </Link>
              </li>
              <li>
                <Link href="/products/bio" className="hover:text-purple-600 transition-colors">
                  KlikBio (Link-in-Bio)
                </Link>
              </li>
              <li>
                <Link href="/products/shortener" className="hover:text-purple-600 transition-colors">
                  URL Shortener
                </Link>
              </li>
              <li>
                <Link href="/products/qr-codes" className="hover:text-purple-600 transition-colors">
                  Dynamic QR Codes
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-purple-600 transition-colors">
                  Pricing &amp; Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources & Support */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/about" className="hover:text-purple-600 transition-colors">
                  About KlikForm
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-purple-600 transition-colors">
                  User Login
                </Link>
              </li>
              <li>
                <Link href="/login?tab=signup" className="hover:text-purple-600 transition-colors">
                  Sign Up Free
                </Link>
              </li>
              <li>
                <a href="mailto:support@klikform.com" className="hover:text-purple-600 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-purple-600 transition-colors">
                  Privacy Policy &amp; PDPA
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-purple-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-purple-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} KlikForm. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Designed &amp; Built with</span>
            <span className="text-rose-500">❤️</span>
            <span>in Malaysia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
