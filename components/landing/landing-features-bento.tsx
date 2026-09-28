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
    <section id="features" className="py-20 md:py-28 bg-slate-50/60 border-y border-slate-200/60">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            One Complete Ecosystem. <br className="hidden sm:inline" />
            Everything You Need to Manage Data &amp; Documents.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
          >
            KlikForm is more than a standard form builder. We seamlessly combine spreadsheet
            automation, high-definition e-certificate design, and verification systems into a single unified platform.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
          {/* Bento Card 1: Google Sheets Sync (2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Dual Methods: OAuth &amp; Service Account
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Real-Time Google Sheets Sync
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Every response submitted by participants is instantly synced into your Google Sheet
                in milliseconds. Equipped with a <strong className="text-slate-800 font-semibold">Formula Injection Shield</strong> and automatic header synchronization without requiring expensive third-party webhooks.
              </p>
            </div>

            {/* Micro visual: Mini table preview */}
            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 font-mono text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-200/60 font-sans font-medium">
                <span>RECENT ROWS (AUTO-SYNCED)</span>
                <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-white border border-slate-200/40">
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">Siti Sarah</span>
                <span className="text-slate-500">950312-08-5120</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Saved</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-white border border-slate-200/40">
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">Khairul Amri</span>
                <span className="text-slate-500">910408-14-6179</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Saved</span>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: Canva-Style E-Cert Studio (2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="md:col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                  Canva-Style Drag-To-Scale
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Professional E-Certificate Studio
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Design certificates freely using our intuitive canvas studio. Features 4-corner scale handles,
                Google calligraphy fonts, diverse ready-to-use templates, and <strong className="text-slate-800 font-semibold">Auto-Scaling Typography</strong> that ensures lengthy event titles never get cut off.
              </p>
            </div>

            {/* Micro visual: Mini cert with badge */}
            <div className="mt-2 p-3.5 rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-amber-700 font-semibold">
                  10+ Ready-To-Use Templates
                </div>
                <div className="text-xs font-serif font-bold text-slate-800 mt-0.5">
                  Classic, Modern, Royal, Minimalist
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                A4 Landscape &amp; Portrait
              </span>
            </div>
          </motion.div>

          {/* Bento Card 3: Penjanaan Pukal CSV ke ZIP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Bulk Certificates (CSV to ZIP)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload a participant CSV list. KlikForm generates hundreds of individual PDF/PNG certificates and packages them into a ZIP archive in seconds.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
              <span>CSV → Hundreds of Certs → Instant ZIP</span>
            </div>
          </motion.div>

          {/* Bento Card 4: KlikBio (Link-in-Bio) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 border border-orange-100">
                <LinkIcon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                KlikBio (Link-in-Bio)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A personal or business bio micro-page with social media links, direct WhatsApp chat buttons, KlikForm links, and 8 aesthetic background patterns.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-orange-600 font-medium">
              <span>8 Themes &amp; Smart Background Patterns</span>
            </div>
          </motion.div>

          {/* Bento Card 5: Logik Bersyarat & Pelbagai Halaman */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Multi-Page &amp; Conditional Logic
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create dynamic forms with Page Breaks, Skip Logic, and robust AND/OR rule conditions for smooth user experiences.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
              <span>Cleaner, responsive multi-step forms</span>
            </div>
          </motion.div>

          {/* Bento Card 6: Portal Semakan & Verifikasi QR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Lookup Portal &amp; QR Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Participants can easily search and re-download their certificates using IC or email. Tamper-evident QR codes verify authenticity instantly.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
              <span>IC / Email Lookup + Instant Verification</span>
            </div>
          </motion.div>

          {/* Bento Card 7 (Wide - 2 cols on Desktop): Analitik Privasi, Magic Edit Link & Pematuhan PDPA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="md:col-span-3 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span>ANALYTICS &amp; DATA PRIVACY</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Respondent Insights &amp; Complete Privacy Protection
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pinpoint where respondents abandon your forms (*drop-off fields*), track conversion rates, and measure completion time with privacy-first analytics (no raw IPs stored). Complete with Single-Use Response Edit Magic Links and automated Personal Data Protection Act (PDPA) consent.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Field Drop-Off &amp; Funnel Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Automated PDPA Consent Checkbox</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Single-Use Response Edit Magic Link</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Countdown Timer &amp; GPS Location Gating</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
