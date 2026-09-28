"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Award,
  Sparkles,
  QrCode,
  CheckCircle2,
  Download,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SHOWCASE_TABS = [
  {
    id: "forms",
    label: "Forms & Spreadsheets",
    icon: FileSpreadsheet,
    tag: "Smart Automation",
    title: "Build unlimited forms, save directly to Google Sheets",
    desc: "Build forms as easily as drag-and-drop. Full support for Google Drive file uploads, conditional logic, registration deadlines, and instant email confirmations to respondents.",
    bullets: [
      "No more manual copy-pasting into spreadsheets",
      "Automatic synchronization of new rows and column headers",
      "Data integrity protection against formula injection",
      "Single-use Response Edit Magic Links sent via email",
    ],
  },
  {
    id: "certificates",
    label: "E-Cert Studio",
    icon: Award,
    tag: "Canva-Style",
    title: "Design professional e-certificates with Canva-like scaling",
    desc: "Equipped with interactive corner handles to scale text and logos effortlessly. Includes 10+ elegant pre-built templates, Google calligraphy fonts, and auto-scaling typography so lengthy titles never clip.",
    bullets: [
      "Auto-scale font size for lengthy event titles",
      "High-quality PDF & PNG export (300 DPI)",
      "Verification QR code badge linking to official lookup portal",
      "Dual-signatory presets (Director & Chairman)",
    ],
  },
  {
    id: "bulk",
    label: "Bulk Generator",
    icon: Sparkles,
    tag: "Bulk CSV to ZIP",
    title: "Generate hundreds of certificates in seconds from CSV",
    desc: "Managing 500 attendees for an event or workshop? Simply upload a CSV file with names and identity numbers. KlikForm renders individual certificates for every participant and packages them into a ZIP archive automatically.",
    bullets: [
      "Smart column auto-detection (Name, IC, Program, Date)",
      "Blazing-fast in-browser rendering without server bottlenecks",
      "Systematic file naming by attendee name or identity number",
      "Ideal for schools, universities, conferences & sports events",
    ],
  },
  {
    id: "verification",
    label: "IC & QR Lookup Portal",
    icon: ShieldCheck,
    tag: "Anti-Fraud",
    title: "Public lookup portal without attendee login required",
    desc: "Participants can check and download their certificates anytime via a public lookup portal using their IC or email. Employers and third parties can scan the QR code to verify authenticity instantly.",
    bullets: [
      "Instant search by IC / Passport number or email",
      "Unique QR code links directly to certificate verification status",
      "Eliminate inquiries and lost certificate replacement requests",
      "Secure verification without requiring participants to sign up",
    ],
  },
];

export function LandingShowcase() {
  const [activeTab, setActiveTab] = React.useState("forms");
  const current = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0];

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
            Streamline Your Workflow from Start to Finish
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal">
            Explore any module below to see how KlikForm solves your daily event and form management challenges.
          </p>
        </div>

        {/* Tab Buttons (Pills) */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto mb-12">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="showcaseActivePill"
                    className="absolute inset-0 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? "text-purple-600" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display Area */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 md:p-10 shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Text & Features */}
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                  {current.tag}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                  {current.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {current.desc}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button size="lg" className="rounded-xl h-11 px-6 bg-slate-900 text-white hover:bg-slate-800" asChild>
                    <Link href="/login?tab=signup">
                      Try It Free Now
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Visual Mockup */}
              <div className="lg:col-span-6">
                {current.id === "forms" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 font-sans">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-800">
                        Live Form Builder
                      </div>
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium">
                        Sheets Connected
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">1. Personal Details</div>
                      <div className="h-8 bg-white rounded border border-slate-200/80 px-2.5 text-xs text-slate-400 flex items-center">
                        Participant Full Name...
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 space-y-1">
                      <div className="text-[11px] font-semibold text-purple-900 flex items-center justify-between">
                        <span>2. Page Break</span>
                        <span className="text-[10px] text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded font-sans">
                          Multi-page active
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-600">
                        Respondents click &quot;Next&quot; to advance to Page 2.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">3. Slot &amp; Session Options</div>
                      <div className="h-8 bg-white rounded border border-slate-200/80 px-2.5 text-xs text-slate-700 flex items-center justify-between">
                        <span>Morning Session (9.00 AM - 12.00 PM)</span>
                        <span className="text-[10px] text-slate-400">Radio Choice</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
                      <span>✓ Automatic column synchronization</span>
                      <span className="font-semibold text-slate-700">Saved to Cloud</span>
                    </div>
                  </div>
                )}

                {current.id === "certificates" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-center">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-left">
                      <div className="text-xs font-bold text-slate-800">
                        Canva-Style Drag-To-Scale Studio
                      </div>
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                        Fit-To-Screen (100%)
                      </span>
                    </div>

                    <div className="border-2 border-dashed border-purple-300 p-6 rounded-xl bg-purple-50/20 relative">
                      {/* Corner Handles Indicator */}
                      <span className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-purple-600 border-2 border-white shadow-2xs" />
                      <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-purple-600 border-2 border-white shadow-2xs" />
                      <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-purple-600 border-2 border-white shadow-2xs" />
                      <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-purple-600 border-2 border-white shadow-2xs" />

                      <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold mb-1">
                        OFFICIAL PARTICIPATION CERTIFICATE
                      </div>
                      <div className="text-base sm:text-lg font-serif font-bold text-slate-900">
                        NURUL IZZATI BINTI KAMARUDDIN
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto italic">
                        National Documentation Management &amp; Form Automation Workshop 2026
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-left">
                        <div className="text-[10px] text-slate-500">
                          Date: <strong>14/09/2026</strong>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded">
                          <QrCode className="h-5 w-5 text-slate-800" />
                          <span className="text-[9px] font-mono text-slate-600">KF-2026-901</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-around text-[11px] text-slate-600 pt-1">
                      <span>• Smart font auto-scaling</span>
                      <span>• 10+ Pre-built templates</span>
                      <span>• 300 DPI PDF export</span>
                    </div>
                  </div>
                )}

                {current.id === "bulk" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-800">
                        Bulk Certificate Generator (CSV → ZIP)
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        Fast In-Browser Engine
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                        <span>Processing 250 Participants from `participants.csv`</span>
                        <span className="text-indigo-600 font-bold">100% Completed</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full w-full" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        All 250 e-certificates rendered successfully in high-definition 300 DPI.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Download className="h-4 w-4 text-indigo-600" />
                        <span>attendee-certificates-2026.zip (42.5 MB)</span>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono">
                        Download
                      </span>
                    </div>
                  </div>
                )}

                {current.id === "verification" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-800">
                        Public Certificate Lookup Portal (/check)
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                        Verified Authentic
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <div className="h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 flex items-center">
                        940812-10-5421
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Record Found &amp; Certificate Available</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Name: <strong>Ahmad Farhan bin Mohd Salleh</strong> <br />
                        Program: <strong>Digital Leadership Workshop 2026</strong> <br />
                        Serial No.: <span className="font-mono">KF-CERT-9821</span>
                      </p>
                      <div className="pt-1 flex gap-2">
                        <div className="h-7 px-3 rounded bg-emerald-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow-2xs">
                          <Download className="h-3 w-3" />
                          <span>Download PDF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
