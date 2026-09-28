"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Sparkles,
  Link as LinkIcon,
  QrCode,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PREVIEW_TABS = [
  {
    id: "forms",
    label: "Smart Forms",
    badge: "Auto-Sync Sheets",
    icon: FileSpreadsheet,
  },
  {
    id: "certificates",
    label: "E-Cert Studio",
    badge: "Canva-Style",
    icon: Award,
  },
  {
    id: "sheets",
    label: "Google Sheets",
    badge: "Real-Time",
    icon: Layers,
  },
  {
    id: "bio",
    label: "KlikBio",
    badge: "Link-in-Bio",
    icon: LinkIcon,
  },
];

export function LandingHero() {
  const [activeTab, setActiveTab] = React.useState("forms");

  return (
    <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-white">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] -z-10 bg-gradient-to-b from-purple-50/50 via-slate-50/30 to-transparent blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/90 text-xs font-medium text-slate-700 shadow-xs mb-6 hover:bg-slate-100/80 transition-colors"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Next-Gen Online Form &amp; E-Certificate Platform</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] mb-6 [text-wrap:balance]"
          >
            Build Smart Forms. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800">
              Automate E-Certificates.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed [text-wrap:balance]"
          >
            Collect registrations directly into Google Sheets in real time and automatically issue
            high-resolution e-certificates to attendees in seconds. Powered by KlikBio and secure QR verification.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10"
          >
            <Button
              size="lg"
              className="h-12 px-8 rounded-xl text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all w-full sm:w-auto group"
              asChild
            >
              <Link href="/login?tab=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 rounded-xl text-base font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full sm:w-auto"
              asChild
            >
              <Link href="#features">
                <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
                Explore Features
              </Link>
            </Button>
          </motion.div>

          {/* Key Proof Checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Google Sheets Auto-Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Instant QR-Verified E-Certs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>PDPA &amp; Privacy Compliant</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive App Window Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Window Chrome Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
                <div className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200/70 text-xs text-slate-500 font-mono">
                  <span className="text-slate-400">https://</span>
                  <span>klikform.com/app/demo</span>
                </div>
              </div>

              {/* Interactive Tabs inside Mockup */}
              <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
                {PREVIEW_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="heroTabBubble"
                          className="absolute inset-0 rounded-md bg-white shadow-xs"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mockup Dynamic Content Area */}
            <div className="p-6 md:p-8 bg-slate-50/40 min-h-[360px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeTab === "forms" && (
                  <motion.div
                    key="tab-forms"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                          Course Registration Form 2026
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          Digital Leadership &amp; Management Seminar
                        </h3>
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Full Name (As in Identity Card / Passport) *
                        </label>
                        <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800 flex items-center">
                          Ahmad Farhan bin Mohd Salleh
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Identity Card / Passport No. *
                          </label>
                          <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800 flex items-center">
                            940812-10-5421
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Official Email Address *
                          </label>
                          <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-800 flex items-center">
                            farhan@school.edu.my
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>PDPA Consent enabled</span>
                        </div>
                        <div className="h-8 px-4 rounded-lg bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs">
                          <span>Submit &amp; Generate E-Cert</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "certificates" && (
                  <motion.div
                    key="tab-certificates"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-medium">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Canva-Style Studio</span>
                    </div>

                    {/* Certificate Preview Card */}
                    <div className="border-4 border-double border-amber-600/30 p-6 rounded-lg bg-amber-50/20 text-center relative">
                      <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                        Certificate of Appreciation &amp; Participation
                      </div>
                      <h4 className="text-xl md:text-2xl font-serif text-slate-900 font-bold mb-2">
                        AHMAD FARHAN BIN MOHD SALLEH
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 italic">
                        For successfully completing the National Digital Leadership &amp;
                        Teacher Professionalism Workshop 2026.
                      </p>

                      <div className="flex items-end justify-between pt-3 border-t border-slate-200/70 text-left">
                        <div>
                          <div className="text-[10px] text-slate-400">Date Issued</div>
                          <div className="text-xs font-semibold text-slate-700">14 September 2026</div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200 shadow-xs">
                          <QrCode className="h-7 w-7 text-slate-800" />
                          <div className="text-[10px] leading-tight text-slate-500">
                            <span className="font-mono text-slate-700 font-bold">KF-CERT-9821</span>
                            <br />
                            Scan to Verify
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>✓ Auto-scale long titles</span>
                      <span>✓ Export 300 DPI PDF &amp; PNG</span>
                      <span>✓ Bulk CSV to ZIP Generator</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "sheets" && (
                  <motion.div
                    key="tab-sheets"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-800 font-mono">
                          Course Registration 2026 (Responses)
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Google Sheets Auto-Sync
                      </span>
                    </div>

                    {/* SpreadSheet Mock Table */}
                    <div className="overflow-x-auto rounded border border-slate-200 text-xs">
                      <table className="w-full text-left font-mono">
                        <thead className="bg-slate-100/90 text-slate-600">
                          <tr>
                            <th className="p-2 border-r border-slate-200">#</th>
                            <th className="p-2 border-r border-slate-200">Timestamp</th>
                            <th className="p-2 border-r border-slate-200">Participant Name</th>
                            <th className="p-2 border-r border-slate-200">Identity No.</th>
                            <th className="p-2">E-Cert Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr className="bg-emerald-50/40">
                            <td className="p-2 border-r border-slate-200 text-slate-400">1</td>
                            <td className="p-2 border-r border-slate-200">14/09/2026 15:20</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">Ahmad Farhan</td>
                            <td className="p-2 border-r border-slate-200">940812105421</td>
                            <td className="p-2 text-emerald-600 font-medium">Sent (Email)</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-slate-200 text-slate-400">2</td>
                            <td className="p-2 border-r border-slate-200">14/09/2026 15:22</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">Nurul Izzati</td>
                            <td className="p-2 border-r border-slate-200">960405036122</td>
                            <td className="p-2 text-emerald-600 font-medium">Sent (Email)</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-slate-200 text-slate-400">3</td>
                            <td className="p-2 border-r border-slate-200">14/09/2026 15:24</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">Muhammad Danish</td>
                            <td className="p-2 border-r border-slate-200">921104145981</td>
                            <td className="p-2 text-emerald-600 font-medium">Sent (Email)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>• Formula injection shield active</span>
                      <span>• Dual Google OAuth &amp; Service Account support</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "bio" && (
                  <motion.div
                    key="tab-bio"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center"
                  >
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto mb-2.5 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      KF
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Digital Training Academy</h4>
                    <p className="text-[11px] text-slate-500 mb-4">klikform.com/bio/digitalacademy</p>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                        <span>Course Registration Form 2026</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span>Attendee E-Certificate Lookup (Official Portal)</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors font-medium text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                        <span>💬 Contact Secretariat (WhatsApp)</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      8 Beautiful Themes &amp; Background Patterns (Link-in-Bio)
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
