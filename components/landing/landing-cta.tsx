"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background subtle radial lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.18),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight [text-wrap:balance]"
          >
            Ready to Automate Your Forms &amp; E-Certificates?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Join thousands of educators, event organizers, and businesses who have
            eliminated time-consuming manual workflows. Free to get started.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button
              size="lg"
              className="h-13 px-9 rounded-xl text-base font-semibold bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-white/10 transition-all w-full sm:w-auto group"
              asChild
            >
              <Link href="/login?tab=signup">
                Create Free Account Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 rounded-xl text-base font-medium border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 hover:text-white w-full sm:w-auto"
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
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Free forever for core features</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Local Malaysian payment support</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
