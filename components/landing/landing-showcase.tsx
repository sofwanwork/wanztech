"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Award,
  Sparkles,
  Download,
  Search,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SHOWCASE_TABS = [
  {
    id: "forms",
    label: "Forms & Spreadsheets",
    icon: FileSpreadsheet,
    tag: "AUTOMATED PIPELINE",
    title: "Build custom forms, stream directly into Google Sheets",
    desc: "Create clean, responsive forms with drag-and-drop ease. Full support for Google Drive file uploads, conditional logic branches, deadline countdown timers, and immediate email receipts.",
    bullets: [
      "Zero manual data export or copy-pasting",
      "Continuous bi-directional column and row synchronization",
      "Active formula injection sanitizer on every submitted cell",
      "Single-use response edit magic links delivered via email",
    ],
  },
  {
    id: "certificates",
    label: "E-Cert Studio",
    icon: Award,
    tag: "PRECISION ENGINE",
    title: "Design verifiable digital certificates with precision canvas",
    desc: "Interactive corner handles scale typography and seals effortlessly. Includes 10+ pre-built templates, Google calligraphy fonts, and mathematical auto-scaling so long names never clip borders.",
    bullets: [
      "Dynamic auto-scale font sizing for long participant names",
      "Crisp vector PDF & high-resolution PNG export (300 DPI)",
      "Tamper-evident QR code badge linked to public verification ledger",
      "Dual-signatory presets (Director, Chair, or Instructor)",
    ],
  },
  {
    id: "bulk",
    label: "Bulk Generator",
    icon: Sparkles,
    tag: "CSV TO ARCHIVE",
    title: "Generate hundreds of certificates from CSV in seconds",
    desc: "Issuing certificates for 500 attendees? Upload a spreadsheet or CSV. KlikForm compiles individualized certificates client-side in seconds and packages them into a clean ZIP archive.",
    bullets: [
      "Automatic column detection (Name, ID, Program, Date)",
      "High-speed browser compilation without server rate limits",
      "Deterministic file naming by attendee name or serial code",
      "Designed for institutions, conferences, and training workshops",
    ],
  },
  {
    id: "verification",
    label: "Verification Portal",
    icon: ShieldCheck,
    tag: "ANTI-FRAUD LEDGER",
    title: "Self-service lookup portal without required logins",
    desc: "Participants can query and re-download their certificates at any time using their ID or email. Employers and verifiers can scan the QR code to check validity on the spot.",
    bullets: [
      "Instant query by ID, passport number, or email address",
      "Cryptographically tamper-evident serial numbers",
      "Eliminates manual lost certificate reprint requests",
      "Secure verification without forcing attendees to create accounts",
    ],
  },
];

export function LandingShowcase() {
  const [activeTab, setActiveTab] = React.useState("forms");
  const current = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0];

  // Bulk Generator simulation state
  const [bulkProgress, setBulkProgress] = React.useState(100);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const triggerBulkRender = () => {
    setIsProcessing(true);
    setBulkProgress(15);
    setTimeout(() => setBulkProgress(55), 300);
    setTimeout(() => setBulkProgress(85), 600);
    setTimeout(() => {
      setBulkProgress(100);
      setIsProcessing(false);
    }, 900);
  };

  // Lookup simulation state
  const [searchQuery, setSearchQuery] = React.useState("A9842104");

  return (
    <section className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Deep Dive
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]">
            Engineered for Everyday Operations
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal [text-wrap:balance]">
            Explore each functional domain below to understand how KlikForm replaces fragmented tools.
          </p>
        </div>

        {/* Tab Controls (Segmented low-radius) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-3xl mx-auto mb-10 bg-slate-100 p-1 rounded-md border border-slate-200">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-white text-violet-900 font-semibold shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display Area */}
        <div className="max-w-5xl mx-auto rounded-lg border border-slate-200 bg-slate-50/40 p-6 md:p-9 shadow-2xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            >
              {/* Left Column: Text & Features */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-50 text-violet-900 border border-violet-200/80">
                  {current.tag}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                  {current.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {current.desc}
                </p>

                <div className="space-y-2 pt-1 font-mono text-xs">
                  {current.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 font-sans">
                      <Check className="h-4 w-4 text-violet-900 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3">
                  <Button size="lg" className="rounded-md h-10 px-5 bg-violet-900 text-white hover:bg-violet-950 text-xs font-medium shadow-xs" asChild>
                    <Link href="/login?tab=signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Visual Mockup */}
              <div className="lg:col-span-6">
                {current.id === "forms" && (
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs space-y-3 font-sans">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">
                        Form Builder &amp; Sheet Pipeline
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                        Bi-Directional Sync
                      </span>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">1. Respondent Intake</div>
                      <div className="h-8 bg-white rounded border border-slate-200 px-2.5 text-xs text-slate-500 flex items-center">
                        Full Name, Official Email, Organization
                      </div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-white space-y-1">
                      <div className="text-[11px] font-semibold text-slate-900 flex items-center justify-between">
                        <span>2. Skip Logic &amp; Page Breaks</span>
                        <span className="text-[10px] text-slate-500 font-mono">Condition: If Corporate</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Routes respondent automatically to Tax Invoicing sub-step.
                      </div>
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">3. Real-Time Destination</div>
                      <div className="h-8 bg-white rounded border border-slate-200 px-2.5 text-xs text-slate-700 flex items-center justify-between font-mono">
                        <span>Google Sheet: /Registrations_2026</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Row 142 Added</span>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                      <span>• Formula injection shield active</span>
                      <span className="text-slate-800 font-medium">Automatic Retry</span>
                    </div>
                  </div>
                )}

                {current.id === "certificates" && (
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-center">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-left">
                      <div className="text-xs font-bold text-slate-900">
                        Canvas Typography &amp; Scale Engine
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        Vector Precision
                      </span>
                    </div>

                    <div className="border border-slate-300 p-5 rounded bg-slate-50 relative">
                      <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold mb-1">
                        CERTIFICATE OF PARTICIPATION
                      </div>
                      <div className="text-lg font-serif font-bold text-slate-950">
                        DR. ELEANOR VANCE
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                        For delivering the Keynote Address at the 2026 Systems &amp; Data Summit.
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-left">
                        <div className="text-[10px] text-slate-500 font-mono">
                          Date: <span className="text-slate-800 font-bold">October 30, 2026</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          <QrCode className="h-4 w-4 text-slate-800" />
                          <span className="text-[9px] font-mono text-slate-700">KF-2026-901</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-around text-xs text-slate-600 font-mono pt-1">
                      <span>• Auto-fit font size</span>
                      <span>• 10+ Layout templates</span>
                      <span>• 300 DPI vector PDF</span>
                    </div>
                  </div>
                )}

                {current.id === "bulk" && (
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">
                        Bulk Generator (CSV to ZIP)
                      </div>
                      <button
                        onClick={triggerBulkRender}
                        disabled={isProcessing}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded font-mono cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${isProcessing ? "animate-spin" : ""}`} />
                        <span>Re-run Simulation</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-800">
                        <span>Rendering 250 rows from `roster.csv`</span>
                        <span className="font-bold text-slate-900">{bulkProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-violet-900 transition-all duration-300"
                          style={{ width: `${bulkProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        All certificates compiled client-side in Web Workers without overloading servers.
                      </p>
                    </div>

                    <div className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-800 font-mono">
                        <Download className="h-4 w-4 text-slate-900" />
                        <span>event-certificates-2026.zip (41.2 MB)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                        Ready
                      </span>
                    </div>
                  </div>
                )}

                {current.id === "verification" && (
                  <div className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">
                        Public Certificate Verification (/verify)
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                        Authentic Record
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by ID or Email..."
                        className="h-8 pl-8 pr-3 w-full rounded border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
                      />
                    </div>

                    <div className="p-3 rounded border border-slate-200 bg-slate-50 text-left space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Record Verified in Registry</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-sans">
                        Recipient: <strong>Alex Morgan</strong> <br />
                        Accreditation: <strong>Digital Governance Seminar 2026</strong> <br />
                        Serial Code: <span className="font-mono text-slate-800">{searchQuery || "KF-9821"}</span>
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                          <Download className="h-3 w-3" />
                          Download Verified PDF
                        </span>
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
