"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Award,
  Sparkles,
  Link as LinkIcon,
  GitBranch,
  ShieldCheck,
  BarChart3,
  Check,
} from "lucide-react";

export function LandingFeaturesBento() {
  return (
    <section id="features" className="py-20 md:py-28 bg-slate-50/60 border-b border-slate-200/80">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2"
          >
            Capabilities
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            One Unified Architecture. <br className="hidden sm:inline" />
            Zero Middleware Headaches.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed [text-wrap:balance]"
          >
            KlikForm combines high-speed form intake, direct Google Sheets bi-directional synchronization,
            and an in-browser digital certificate publishing engine into a single focused tool.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {/* Bento Card 1: Google Sheets Sync (2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="md:col-span-2 lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 md:p-7 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Direct OAuth &amp; Service Account
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                Real-Time Google Sheets Sync
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Submissions stream into your connected Google Sheet in milliseconds. Protected by an
                automated <strong className="text-slate-800 font-semibold">Formula Injection Shield</strong> that sanitizes dangerous spreadsheet formulas (`=`, `+`, `@`, `-`) automatically.
              </p>
            </div>

            {/* Micro visual: Mini table preview */}
            <div className="mt-2 rounded border border-slate-200 bg-slate-50/80 p-3 font-mono text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-200 font-sans font-medium">
                <span>RECENT SUBMISSIONS</span>
                <span className="text-emerald-700 flex items-center gap-1 font-mono font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-white border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">Sarah Chen</span>
                <span className="text-slate-500 font-mono">schen@design.org</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono">Synced</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-white border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">Marcus Vance</span>
                <span className="text-slate-500 font-mono">mvance@corp.com</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-mono">Synced</span>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: Canva-Style E-Cert Studio (2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="md:col-span-1 lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 md:p-7 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Canvas Studio Engine
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                Precision E-Certificate Studio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Direct in-browser visual canvas with interactive scaling handles, curated typography,
                dual-signatory presets, and <strong className="text-slate-800 font-semibold">Auto-Scaling Font Math</strong> that ensures long attendee names never clip off borders.
              </p>
            </div>

            {/* Micro visual: Mini cert with badge */}
            <div className="mt-2 p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  10+ Curated Layouts
                </div>
                <div className="text-xs font-serif font-bold text-slate-800 mt-0.5">
                  Classic, Modern, Academic, Minimalist
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                A4 Landscape &amp; Portrait
              </span>
            </div>
          </motion.div>

          {/* Bento Card 3: Bulk CSV to ZIP */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-4">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Bulk Generator (CSV → ZIP)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload a CSV roster. KlikForm renders hundreds of individual PDF/PNG certificates client-side and packages them into a clean ZIP archive.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              Instant in-browser rendering
            </div>
          </motion.div>

          {/* Bento Card 4: KlikBio (Link-in-Bio) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-4">
                <LinkIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                KlikBio (Link-in-Bio)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A focused bio micro-page with WhatsApp routing buttons, form links, custom themes, and clean background patterns for social profiles.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              8 Themes &amp; Patterns
            </div>
          </motion.div>

          {/* Bento Card 5: Conditional Logic & Multi-Page */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-4">
                <GitBranch className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Logic &amp; Multi-Step Pages
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build progressive disclosure flows with Page Breaks, Skip Logic, and field-level AND/OR branching rules.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              Dynamic branch execution
            </div>
          </motion.div>

          {/* Bento Card 6: IC & QR Lookup Portal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-4">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Public Verification Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Attendees can retrieve lost certificates using their IC or email. Third parties scan the QR code to verify validity without creating an account.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              Zero login required
            </div>
          </motion.div>

          {/* Bento Card 7 (Wide - Full Width): Analytics & Privacy Protection */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="md:col-span-3 lg:col-span-4 bg-white rounded-lg border border-slate-200 p-6 md:p-7 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-slate-700" />
                  <span>DATA PRIVACY &amp; RESPONDENT ANALYTICS</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Privacy-First Funnels &amp; Magic Edit Links
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Analyze drop-off fields and completion rates without tracking personal identifiable telemetry or raw IP addresses. Includes Single-Use Response Edit Magic Links and automated Personal Data Protection Act (PDPA) consent.
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                  <span>Field drop-off &amp; completion duration</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                  <span>Automated PDPA consent checkbox</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                  <span>Single-use response edit magic links</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                  <span>Submission countdowns &amp; quota limits</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
