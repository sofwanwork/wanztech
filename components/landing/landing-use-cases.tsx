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
    category: "Education & Schools",
    title: "Teachers, Lecturers & Academic Institutions",
    desc: "Manage extracurricular sign-ups, sports events, attendance countdown timers, and automatically issue student participation e-certificates with ease.",
    points: [
      "Bulk generate student certificates from CSV",
      "Parent certificate lookup portal using student IC / Identity No.",
      "Attendance tracking with automated countdown lock",
    ],
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: CalendarDays,
    category: "Events & Conferences",
    title: "Event & Webinar Organizers",
    desc: "Effortless attendee registration, dynamic ticketing QR codes, and automated delivery of digital certificates of appreciation directly via email.",
    points: [
      "Registration data flows straight into Google Sheets",
      "Tamper-evident QR code stamps on every certificate",
      "Respondents can update entries using single-use Magic Links",
    ],
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    icon: ShoppingBag,
    category: "Commerce & Creators",
    title: "WhatsApp Merchants & E-Commerce",
    desc: "Replace messy manual order forms with sleek, mobile-optimized checkout pages that send formatted order summaries directly to your WhatsApp.",
    points: [
      "Professional KlikBio link-in-bio page for social media",
      "Instant 'Send to WhatsApp' chat button",
      "Order forms with product image options and variants",
    ],
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: Building2,
    category: "Corporate & Operations",
    title: "Companies & HR Teams",
    desc: "Leave applications, expense claims, internal staff surveys, and compliance checks with full alignment to data protection regulations.",
    points: [
      "Automated Personal Data Protection Act (PDPA) consent",
      "Immutable audit logs for administrative security",
      "Outgoing Webhooks for seamless internal API integrations",
    ],
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
];

export function LandingUseCases() {
  return (
    <section className="py-20 md:py-28 bg-slate-50/70 border-t border-slate-200/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            Designed for Organizations &amp; Individuals Alike
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
          >
            From schools and universities to corporate teams, KlikForm streamlines your daily data collection and certificate distribution.
          </motion.p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {USE_CASES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {item.points.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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
