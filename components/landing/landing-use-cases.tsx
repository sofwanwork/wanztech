"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  CalendarDays,
  ShoppingBag,
  Building2,
  Check,
} from "lucide-react";

const USE_CASES = [
  {
    icon: GraduationCap,
    category: "EDUCATION & ACADEMIA",
    title: "Schools, Universities & Educators",
    desc: "Manage extracurricular enrollments, departmental symposiums, attendance gates, and automatically dispatch accredited student e-certificates upon completion.",
    points: [
      "Bulk generate student certificates directly from CSV rosters",
      "Public student certificate self-lookup portal using Student ID or IC",
      "Automated attendance cutoff timers and deadline gating",
    ],
  },
  {
    icon: CalendarDays,
    category: "EVENTS & CONFERENCES",
    title: "Conferences & Summit Organizers",
    desc: "Seamless registrant intake, dynamic check-in ticketing QR codes, and automated delivery of high-resolution digital certificates of appreciation.",
    points: [
      "Registration records stream live into Google Sheets",
      "Tamper-evident verification stamp on every certificate",
      "Attendees can amend submissions via single-use magic links",
    ],
  },
  {
    icon: ShoppingBag,
    category: "COMMERCE & CREATORS",
    title: "Direct Merchants & Digital Creators",
    desc: "Upgrade manual social order forms into clean, fast mobile checkout experiences with immediate order routing directly to WhatsApp.",
    points: [
      "Clean KlikBio link-in-bio hub for Instagram & TikTok profiles",
      "Instant 'Chat on WhatsApp' pre-formatted order button",
      "Product showcase forms with inventory and variant selections",
    ],
  },
  {
    icon: Building2,
    category: "CORPORATE & OPERATIONS",
    title: "Enterprises & Human Resources",
    desc: "Internal staff surveys, expense reporting, vendor onboarding, and compliance acknowledgments with rigorous data protection standards.",
    points: [
      "Automated Personal Data Protection Act (PDPA) consent capture",
      "Immutable administrative audit trails for compliance logs",
      "Direct webhook dispatching for internal infrastructure",
    ],
  },
];

export function LandingUseCases() {
  return (
    <section className="py-20 md:py-28 bg-slate-50/60 border-b border-slate-200/80">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Applications
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            Built for High-Stakes Operations
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed [text-wrap:balance]"
          >
            From national academic competitions to corporate human resources, KlikForm replaces fragile spreadsheets and manual certificate production.
          </motion.p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {USE_CASES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="bg-white rounded-lg border border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5 font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 font-mono text-xs">
                  {item.points.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-slate-700 font-sans">
                      <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
