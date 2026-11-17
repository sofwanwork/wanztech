"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  Award,
  Link as LinkIcon,
  QrCode,
  Layers,
  ChevronRight,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PREVIEW_TABS = [
  {
    id: "forms",
    label: "Smart Forms",
    icon: FileSpreadsheet,
  },
  {
    id: "certificates",
    label: "E-Cert Studio",
    icon: Award,
  },
  {
    id: "sheets",
    label: "Google Sheets",
    icon: Layers,
  },
  {
    id: "bio",
    label: "KlikBio",
    icon: LinkIcon,
  },
];

export function LandingHero() {
  const [activeTab, setActiveTab] = React.useState("forms");

  // Interactive Form Tab States
  const [formName, setFormName] = React.useState("Alex Morgan");
  const [formEmail, setFormEmail] = React.useState("alex.morgan@company.com");
  const [formSubmitted, setFormSubmitted] = React.useState(false);

  // Interactive Certificate Tab States
  const [certOrientation, setCertOrientation] = React.useState<"landscape" | "portrait">("landscape");
  const [certStyle, setCertStyle] = React.useState<"editorial" | "classic">("editorial");
  const [showQrVerification, setShowQrVerification] = React.useState(true);

  // Interactive Sheets Tab States
  const [sheetRows, setSheetRows] = React.useState([
    { id: 1, time: "10:14 AM", name: "Alex Morgan", email: "alex.m@company.com", status: "Synced" },
    { id: 2, time: "10:22 AM", name: "Sarah Chen", email: "schen@design.org", status: "Synced" },
    { id: 3, time: "10:35 AM", name: "David Kim", email: "dkim@tech.co", status: "Synced" },
  ]);

  const addSheetRow = () => {
    const names = ["Elena Rostova", "Marcus Vance", "Priya Patel", "Jordan Lee"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const emailSlug = randomName.toLowerCase().replace(" ", ".");
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSheetRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        time: timeStr,
        name: randomName,
        email: `${emailSlug}@example.com`,
        status: "Synced",
      },
    ]);
  };

  // Interactive Bio Tab Theme
  const [bioTheme, setBioTheme] = React.useState<"light" | "dark">("light");

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 bg-white text-slate-900 border-b border-slate-200/80">
      {/* Subtle fine grid background (no glowing radial blur) */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement Badge - Crisp geometric */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-violet-200/80 bg-violet-50/70 text-xs font-mono text-violet-900 mb-6 hover:border-violet-300 transition-colors"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-violet-900" />
            <span>Next-Gen Form &amp; Digital Certificate Platform</span>
            <ChevronRight className="h-3 w-3 text-violet-400" />
          </motion.div>

          {/* Main Headline - High contrast, Anti-AI slop */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 leading-[1.08] mb-6 [text-wrap:balance]"
          >
            Build Smart Forms. <br className="hidden sm:inline" />
            Automate E-Certificates.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-9 font-normal leading-relaxed [text-wrap:balance]"
          >
            Direct Google Sheets synchronization with zero middleware. Automatically generate
            print-ready e-certificates, complete with tamper-evident QR verification and attendee self-lookup.
          </motion.p>

          {/* Action CTAs - Sharp minimal buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <Button
              size="lg"
              className="h-11 px-7 rounded-md text-sm font-medium bg-violet-900 text-white hover:bg-violet-950 transition-colors w-full sm:w-auto group shadow-xs"
              asChild
            >
              <Link href="/login?tab=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 rounded-md text-sm font-medium border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors w-full sm:w-auto"
              asChild
            >
              <Link href="#features">
                Explore Documentation
              </Link>
            </Button>
          </motion.div>

          {/* Key Proof Checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-mono"
          >
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-900" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-900" />
              <span>Real-time Google Sheets sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-900" />
              <span>Instant QR certificate verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-slate-900" />
              <span>PDPA &amp; GDPR compliant</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive App Window Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Window Chrome Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                <div className="ml-3 hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-slate-200 bg-white text-[11px] text-slate-600 font-mono">
                  <span className="text-slate-400">https://</span>
                  <span>klikform.com/app/preview</span>
                </div>
              </div>

              {/* Interactive Segmented Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-md">
                {PREVIEW_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer rounded ${
                        isActive
                          ? "text-violet-900 font-semibold bg-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mockup Dynamic Content Area */}
            <div className="p-6 md:p-8 bg-slate-50/50 min-h-[380px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {/* 1. Smart Forms Interactive Demo */}
                {activeTab === "forms" && (
                  <motion.div
                    key="tab-forms"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white rounded-md border border-slate-200 p-6 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
                      <div>
                        <span className="inline-block text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Live Interactive Preview
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          Executive Masterclass Registration 2026
                        </h3>
                      </div>
                      <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Live Form
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setFormSubmitted(true);
                      }}
                      className="space-y-3.5"
                    >
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Full Name (for Digital Certificate) *
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => {
                            setFormName(e.target.value);
                            setFormSubmitted(false);
                          }}
                          className="h-9 w-full px-3 rounded border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Identification / Passport Number *
                          </label>
                          <input
                            type="text"
                            defaultValue="A9842104"
                            className="h-9 w-full px-3 rounded border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">
                            Official Email Address *
                          </label>
                          <input
                            type="email"
                            value={formEmail}
                            onChange={(e) => {
                              setFormEmail(e.target.value);
                              setFormSubmitted(false);
                            }}
                            className="h-9 w-full px-3 rounded border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-sans"
                          />
                        </div>
                      </div>

                      {formSubmitted && (
                        <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Response recorded! Google Sheet updated in 140ms and verification QR issued.</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                          <span>PDPA consent enforced</span>
                        </div>
                        <button
                          type="submit"
                          className="h-8 px-4 rounded bg-violet-900 hover:bg-violet-950 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>{formSubmitted ? "Submit Another" : "Simulate Submission"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* 2. E-Certificate Studio Interactive Demo */}
                {activeTab === "certificates" && (
                  <motion.div
                    key="tab-certificates"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white rounded-md border border-slate-200 p-6 shadow-xs relative"
                  >
                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 mb-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Format:</span>
                        <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            onClick={() => setCertOrientation("landscape")}
                            className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                              certOrientation === "landscape" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-500"
                            }`}
                          >
                            Landscape (A4)
                          </button>
                          <button
                            onClick={() => setCertOrientation("portrait")}
                            className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                              certOrientation === "portrait" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-500"
                            }`}
                          >
                            Portrait (A4)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCertStyle(certStyle === "editorial" ? "classic" : "editorial")}
                          className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Style: {certStyle === "editorial" ? "Editorial Serif" : "Modern Bold"}</span>
                        </button>
                        <button
                          onClick={() => setShowQrVerification(!showQrVerification)}
                          className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                            showQrVerification ? "border-violet-900 bg-violet-900 text-white" : "border-slate-200 text-slate-600"
                          }`}
                        >
                          QR Stamp: {showQrVerification ? "On" : "Off"}
                        </button>
                      </div>
                    </div>

                    {/* Certificate Canvas Mockup */}
                    <div
                      className={`border border-slate-300 p-6 rounded bg-slate-50 text-center relative transition-all duration-300 ${
                        certOrientation === "landscape" ? "py-8" : "py-12"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-semibold mb-1">
                        Certificate of Excellence &amp; Participation
                      </div>
                      <h4
                        className={`text-xl md:text-2xl font-bold text-slate-900 mb-2 ${
                          certStyle === "editorial" ? "font-serif tracking-normal" : "font-sans tracking-tight"
                        }`}
                      >
                        {formName.toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto mb-5">
                        For successfully completing the Advanced Systems &amp; Organizational Architecture Workshop 2026.
                      </p>

                      <div className="flex items-end justify-between pt-3 border-t border-slate-200 text-left">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">ISSUED ON</div>
                          <div className="text-xs font-semibold text-slate-800">October 30, 2026</div>
                        </div>

                        {showQrVerification && (
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                            <QrCode className="h-6 w-6 text-slate-800" />
                            <div className="text-[10px] leading-tight text-slate-500 font-mono">
                              <span className="font-bold text-slate-800">KF-9821-VERIFIED</span>
                              <br />
                              Scan to Verify
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>• Auto-scales long participant names</span>
                      <span>• 300 DPI vector PDF &amp; PNG export</span>
                    </div>
                  </motion.div>
                )}

                {/* 3. Google Sheets Interactive Demo */}
                {activeTab === "sheets" && (
                  <motion.div
                    key="tab-sheets"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white rounded-md border border-slate-200 p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-800 font-mono">
                          Live Registrations (Direct Sync)
                        </span>
                      </div>
                      <button
                        onClick={addSheetRow}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Simulate New Row</span>
                      </button>
                    </div>

                    {/* SpreadSheet Mock Table */}
                    <div className="overflow-x-auto rounded border border-slate-200 text-xs">
                      <table className="w-full text-left font-mono">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="p-2 border-r border-slate-200">#</th>
                            <th className="p-2 border-r border-slate-200">Timestamp</th>
                            <th className="p-2 border-r border-slate-200">Full Name</th>
                            <th className="p-2 border-r border-slate-200">Email</th>
                            <th className="p-2">Sync Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {sheetRows.slice(-4).map((row, idx) => (
                            <tr key={row.id} className={idx === sheetRows.length - 1 && sheetRows.length > 3 ? "bg-emerald-50/50" : ""}>
                              <td className="p-2 border-r border-slate-200 text-slate-400">{row.id}</td>
                              <td className="p-2 border-r border-slate-200">{row.time}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{row.name}</td>
                              <td className="p-2 border-r border-slate-200 text-slate-500">{row.email}</td>
                              <td className="p-2 text-emerald-700 font-medium">✓ {row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                      <span>Formula Injection Shield: ACTIVE</span>
                      <span>Zero Webhooks Needed</span>
                    </div>
                  </motion.div>
                )}

                {/* 4. KlikBio Interactive Demo */}
                {activeTab === "bio" && (
                  <motion.div
                    key="tab-bio"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm bg-white rounded-md border border-slate-200 p-5 shadow-xs text-center"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
                      <span className="font-mono text-slate-500">Theme:</span>
                      <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
                        <button
                          onClick={() => setBioTheme("light")}
                          className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                            bioTheme === "light" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-500"
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setBioTheme("dark")}
                          className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                            bioTheme === "dark" ? "bg-slate-900 text-white font-semibold" : "text-slate-500"
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded border transition-colors ${
                        bioTheme === "dark" ? "bg-slate-950 text-white border-slate-800" : "bg-slate-50 text-slate-900 border-slate-200"
                      }`}
                    >
                      <div className="h-12 w-12 rounded-md bg-slate-900 text-white mx-auto mb-2.5 flex items-center justify-center font-bold font-mono text-base border border-slate-700">
                        KF
                      </div>
                      <h4 className="text-sm font-semibold tracking-tight">Executive Tech Academy</h4>
                      <p className={`text-[11px] mb-3.5 font-mono ${bioTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        klikform.com/bio/academy
                      </p>

                      <div className="space-y-2 text-xs">
                        <div
                          className={`p-2.5 rounded border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            bioTheme === "dark"
                              ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Course Registration Form</span>
                        </div>
                        <div
                          className={`p-2.5 rounded border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            bioTheme === "dark"
                              ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span>Digital Certificate Lookup</span>
                        </div>
                        <div
                          className={`p-2.5 rounded border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            bioTheme === "dark"
                              ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Contact Support via WhatsApp</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400 font-mono">
                      8 Curated Themes &amp; Patterns (Link-in-Bio)
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
