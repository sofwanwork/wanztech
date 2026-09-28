"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const COMPARISON_ROWS = [
  {
    feature: "Direct Google Sheets Synchronization",
    klikform: true,
    googleForms: true,
    canvaManual: false,
    others: "Requires Paid Zapier/Make",
  },
  {
    feature: "Interactive E-Certificate Studio (Canva-Style)",
    klikform: true,
    googleForms: false,
    canvaManual: true,
    others: false,
  },
  {
    feature: "Automated E-Cert Generation & Instant Email Delivery",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: "Requires External Add-ons",
  },
  {
    feature: "Bulk Generation from CSV to ZIP Archive",
    klikform: true,
    googleForms: false,
    canvaManual: "Requires Pro Subscription",
    others: false,
  },
  {
    feature: "Public Certificate Lookup Portal (IC & Email)",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: false,
  },
  {
    feature: "Tamper-Evident QR Code & Instant Verification",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: false,
  },
  {
    feature: "KlikBio (Link-in-Bio) Micro-Page",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: "Requires Separate Linktree",
  },
  {
    feature: "PDPA Compliance & Formula Injection Shield",
    klikform: true,
    googleForms: "Basic Only",
    canvaManual: false,
    others: false,
  },
];

export function LandingComparison() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            Stop Repetitive Manual Work
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed"
          >
            Previously, you had to build forms on one platform, design certificates on another,
            and copy-paste attendee data row by row. KlikForm brings everything into one unified workflow.
          </motion.p>
        </div>

        {/* Minimalist Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="max-w-4xl mx-auto rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-4 sm:p-5 font-semibold text-slate-900 w-[38%]">
                    Features &amp; Capabilities
                  </th>

                  {/* KlikForm Column */}
                  <th className="p-4 sm:p-5 text-center w-[24%] bg-purple-50/70 border-x-2 border-purple-200/80">
                    <span className="text-base sm:text-lg font-bold text-purple-700 tracking-tight">
                      KlikForm
                    </span>
                  </th>

                  {/* Google Forms Column */}
                  <th className="p-4 sm:p-5 text-center w-[19%] font-semibold text-slate-700 text-sm sm:text-base">
                    Google Forms
                  </th>

                  {/* Canva Column */}
                  <th className="p-4 sm:p-5 text-center w-[19%] font-semibold text-slate-700 text-sm sm:text-base">
                    Canva Manual
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-slate-800 text-xs sm:text-sm">
                      {row.feature}
                    </td>

                    {/* KlikForm column */}
                    <td className="p-4 sm:p-5 bg-purple-50/25 text-center border-x-2 border-purple-200/80">
                      <div className="flex justify-center">
                        <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </span>
                      </div>
                    </td>

                    {/* Google Forms column */}
                    <td className="p-4 sm:p-5 text-center text-xs text-slate-500">
                      <div className="flex justify-center">
                        {row.googleForms === true ? (
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[2]" />
                          </span>
                        ) : row.googleForms === false ? (
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                            <X className="h-3 w-3 stroke-[2]" />
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                            {row.googleForms}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Canva Manual column */}
                    <td className="p-4 sm:p-5 text-center text-xs text-slate-500">
                      <div className="flex justify-center">
                        {row.canvaManual === true ? (
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[2]" />
                          </span>
                        ) : row.canvaManual === false ? (
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                            <X className="h-3 w-3 stroke-[2]" />
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-medium">
                            {row.canvaManual}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
