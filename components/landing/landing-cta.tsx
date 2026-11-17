"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="py-20 md:py-28 bg-slate-950 text-white border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Ready to Begin
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-tight [text-wrap:balance]"
          >
            Deploy Clean Forms &amp; Instant E-Certificates Today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-9 leading-relaxed font-normal [text-wrap:balance]"
          >
            Eliminate manual spreadsheet data entry and hours of certificate drafting.
            Get started with our free tier in under two minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9"
          >
            <Button
              size="lg"
              className="h-11 px-7 rounded-md text-sm font-medium bg-violet-900 text-white hover:bg-violet-950 transition-colors w-full sm:w-auto group shadow-sm"
              asChild
            >
              <Link href="/login?tab=signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 rounded-md text-sm font-medium border-slate-700 bg-slate-900 text-white hover:bg-slate-800 transition-colors w-full sm:w-auto"
              asChild
            >
              <Link href="/pricing">
                View Plans &amp; Pricing
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-mono"
          >
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-200" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-200" />
              <span>Free forever core features</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-200" />
              <span>Malaysian FPX &amp; international billing</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
