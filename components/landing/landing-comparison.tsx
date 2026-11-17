"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const COMPARISON_ROWS = [
  {
    feature: "Direct Google Sheets Bi-Directional Sync",
    klikform: true,
    googleForms: true,
    canvaManual: false,
    others: "Paid Add-on / Zapier Required",
  },
  {
    feature: "In-Browser Visual Certificate Studio",
    klikform: true,
    googleForms: false,
    canvaManual: true,
    others: false,
  },
  {
    feature: "Automated Certificate Issuance on Submission",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: "Complex Email Scripts",
  },
  {
    feature: "Bulk Generation from CSV to ZIP Archive",
    klikform: true,
    googleForms: false,
    canvaManual: "Pro Subscription Required",
    others: false,
  },
  {
    feature: "Public Self-Service Certificate Lookup Portal",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: false,
  },
  {
    feature: "Cryptographic Tamper-Evident QR Verification",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: false,
  },
  {
    feature: "Dedicated Link-in-Bio Micro-Page (KlikBio)",
    klikform: true,
    googleForms: false,
    canvaManual: false,
    others: "Separate Linktree Plan",
  },
  {
    feature: "Formula Injection Sanitization & PDPA Compliance",
    klikform: true,
    googleForms: "Basic Only",
    canvaManual: false,
    others: false,
  },
];

export function LandingComparison() {
  return (
    <section className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Architecture Comparison
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 [text-wrap:balance]"
          >
            Consolidate Your Software Stack
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed [text-wrap:balance]"
          >
            Instead of stitching together form tools, external graphic design subscriptions, and brittle webhook pipelines, KlikForm delivers an end-to-end operational pipeline.
          </motion.p>
        </div>

        {/* Minimalist Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-4xl mx-auto rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3.5 sm:p-4 font-semibold text-slate-900 w-[40%]">
                    Capability
                  </th>

                  {/* KlikForm Column */}
                  <th className="p-3.5 sm:p-4 text-center w-[24%] bg-violet-50/70 border-x border-violet-200/80">
                    <span className="font-bold text-violet-950 font-mono tracking-tight flex items-center justify-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-900 inline-block" />
                      KlikForm
                    </span>
                  </th>

                  {/* Google Forms Column */}
                  <th className="p-3.5 sm:p-4 text-center w-[18%] font-medium text-slate-600">
                    Google Forms
                  </th>

                  {/* Canva Column */}
                  <th className="p-3.5 sm:p-4 text-center w-[18%] font-medium text-slate-600">
                    Canva Manual
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 sm:p-4 font-medium text-slate-800 text-xs sm:text-sm">
                      {row.feature}
                    </td>

                    {/* KlikForm column */}
                    <td className="p-3.5 sm:p-4 bg-violet-50/20 text-center border-x border-violet-100/60">
                      <div className="flex justify-center">
                        <span className="h-5 w-5 rounded bg-violet-900 text-white flex items-center justify-center shadow-2xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      </div>
                    </td>

                    {/* Google Forms column */}
                    <td className="p-3.5 sm:p-4 text-center text-xs text-slate-500">
                      <div className="flex justify-center">
                        {row.googleForms === true ? (
                          <span className="h-5 w-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </span>
                        ) : row.googleForms === false ? (
                          <span className="h-5 w-5 rounded bg-slate-50 text-slate-400 flex items-center justify-center">
                            <X className="h-3 w-3 stroke-[2]" />
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                            {row.googleForms}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Canva Manual column */}
                    <td className="p-3.5 sm:p-4 text-center text-xs text-slate-500">
                      <div className="flex justify-center">
                        {row.canvaManual === true ? (
                          <span className="h-5 w-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </span>
                        ) : row.canvaManual === false ? (
                          <span className="h-5 w-5 rounded bg-slate-50 text-slate-400 flex items-center justify-center">
                            <X className="h-3 w-3 stroke-[2]" />
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
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
