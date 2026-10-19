'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Award,
  Search,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Calendar,
  Mail,
  CreditCard,
  Sparkles,
  X,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { checkCertificateByICOrEmail, CertificateCheckResult } from '@/actions/certificates';
import { CertificateTemplate } from '@/components/certificate-template';
import { toast } from 'sonner';
import { resolveCategoryTemplateId } from '@/lib/certificates/category';
import { formatAttendanceDate } from '@/lib/forms/attendance';

import {
  CertificateTemplate as CertificateTemplateType,
  CertificateCategoryConfig,
} from '@/lib/types';
import type { CertificateVerificationMode } from '@/lib/certificates/headers';

interface CertificateCheckClientProps {
  formId: string;
  formTitle: string;
  templateId?: string;
  customTemplateData?: CertificateTemplateType | null;
  /** Category → template mapping (when configured on the form). */
  categoryConfig?: CertificateCategoryConfig | null;
  /** All prefetched templates keyed by id (default + mapped categories). */
  templatesById?: Record<string, CertificateTemplateType>;
  /** Minimum hours required to be eligible for certificate. */
  minHoursRequired?: number;
  /** Verification mode detected dynamically from form fields ('ic_only' | 'email_only' | 'both'). */
  verificationMode?: CertificateVerificationMode;
}

export function CertificateCheckClient({
  formId,
  formTitle,
  templateId,
  customTemplateData,
  categoryConfig,
  templatesById,
  minHoursRequired,
  verificationMode = 'both',
}: CertificateCheckClientProps) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateCheckResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const hiddenCertificateRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  const [baseFitScale, setBaseFitScale] = useState(0.5);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [modalZoomMultiplier, setModalZoomMultiplier] = useState(1);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Pick the template based on the respondent's category answer; fall back to
  // the form's default template when there's no category mapping/match.
  const activeTemplate: CertificateTemplateType | null = (() => {
    if (!result?.found) return customTemplateData ?? null;
    const tplId = resolveCategoryTemplateId(
      categoryConfig ?? undefined,
      result.category,
      templateId
    );
    return (tplId && templatesById?.[tplId]) || customTemplateData || null;
  })();

  // Orientation of the active certificate. Falls back to landscape when the
  // template has no explicit dimensions.
  const tplWidth = activeTemplate?.width ?? 1123;
  const tplHeight = activeTemplate?.height ?? 794;
  const isPortrait = tplHeight > tplWidth;
  // Full-size capture dimensions (A4 @ ~96dpi), matched to orientation.
  const captureWidth = isPortrait ? 794 : 1123;
  const captureHeight = isPortrait ? 1123 : 794;

  // Measure the preview wrapper and scale the full-size certificate to "fit"
  // within both the available width and a max height. This keeps portrait
  // certificates from overflowing the card while landscape still fills width.
  useEffect(() => {
    const wrapper = previewWrapperRef.current;
    if (!wrapper) return;
    const update = () => {
      const padding = window.innerWidth < 640 ? 32 : 48;
      const available = wrapper.clientWidth - padding;
      if (available <= 0) return;
      // Allow generous preview height on desktop so portrait certificates are legible and fill the card nicely
      const maxHeight =
        window.innerWidth < 640
          ? Math.min(480, window.innerHeight * 0.6)
          : Math.min(620, Math.max(480, window.innerHeight * 0.65));
      const fitWidth = available / captureWidth;
      const fitHeight = maxHeight / captureHeight;
      setBaseFitScale(Math.min(fitWidth, fitHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [captureWidth, captureHeight, result?.found]);

  const effectiveScale = baseFitScale * zoomMultiplier;

  const [selectedCertIndex, setSelectedCertIndex] = useState(0);

  const dailyOptions =
    result?.dailyCertificates && result.dailyCertificates.length > 1
      ? result.dailyCertificates
      : null;

  const activeDailyOption = dailyOptions ? dailyOptions[selectedCertIndex] || dailyOptions[0] : null;
  const activeCertDate = activeDailyOption ? activeDailyOption.date : result?.date;

  const formattedDate = activeCertDate ? formatAttendanceDate(activeCertDate) || activeCertDate : null;

  const mode: CertificateVerificationMode = verificationMode || 'both';

  const modeContent = {
    email_only: {
      subtitle:
        'Sahkan kehadiran dan muat turun e-sijil rasmi anda dengan memasukkan alamat E-mel pendaftaran.',
      cardDesc: 'Masukkan alamat E-mel yang digunakan semasa pendaftaran program.',
      label: 'Alamat E-mel',
      example: 'cth: nama@email.com',
      placeholder: 'Contoh: nama@email.com',
      hint: (
        <span>
          Masukkan alamat e-mel yang digunakan semasa mengisi borang pendaftaran rasmi.
        </span>
      ),
      emptyToast: 'Sila masukkan alamat e-mel anda',
      inputMode: 'email' as const,
      type: 'email' as const,
    },
    ic_only: {
      subtitle:
        'Sahkan kehadiran dan muat turun e-sijil rasmi anda dengan memasukkan No. Kad Pengenalan pendaftaran.',
      cardDesc: 'Masukkan No. Kad Pengenalan yang digunakan semasa pendaftaran program.',
      label: 'No. Kad Pengenalan (IC)',
      example: 'cth: 901234567890',
      placeholder: 'Contoh: 901020015566',
      hint: (
        <span>
          Masukkan No. IC tanpa sempang (<code>-</code>) seperti 901020015566.
        </span>
      ),
      emptyToast: 'Sila masukkan nombor kad pengenalan anda',
      inputMode: 'numeric' as const,
      type: 'text' as const,
    },
    both: {
      subtitle:
        'Sahkan kehadiran dan muat turun e-sijil rasmi anda dengan memasukkan No. Kad Pengenalan atau E-mel pendaftaran.',
      cardDesc: 'Masukkan No. Kad Pengenalan atau E-mel yang digunakan semasa pendaftaran program.',
      label: 'No. Kad Pengenalan / E-mel',
      example: 'cth: 901234567890',
      placeholder: 'Contoh: 901020015566 atau nama@email.com',
      hint: (
        <span>
          Masukkan No. IC tanpa sempang (<code>-</code>) atau alamat e-mel pendaftaran rasmi.
        </span>
      ),
      emptyToast: 'Sila masukkan No. Kad Pengenalan atau E-mel anda',
      inputMode: 'text' as const,
      type: 'text' as const,
    },
  }[mode];

  const mismatchWarning = (() => {
    if (!identifier.trim()) return null;
    const cleanDigits = identifier.replace(/[-\s]/g, '');
    if (mode === 'ic_only' && identifier.includes('@')) {
      return 'Borang ini menggunakan pengesahan No. Kad Pengenalan (IC). Sila masukkan No. IC tanpa tanda sempang.';
    }
    if (mode === 'email_only' && /^\d{6,}$/.test(cleanDigits) && !identifier.includes('@')) {
      return 'Borang ini menggunakan pengesahan Alamat E-mel. Sila masukkan e-mel pendaftaran anda.';
    }
    return null;
  })();

  const renderInputIcon = () => {
    if (mode === 'email_only') {
      return (
        <Mail
          className={`h-5 w-5 transition-colors ${
            identifier.length > 0 ? 'text-primary' : 'text-slate-400'
          }`}
        />
      );
    }
    if (mode === 'ic_only') {
      return (
        <CreditCard
          className={`h-5 w-5 transition-colors ${
            identifier.length > 0 ? 'text-primary' : 'text-slate-400'
          }`}
        />
      );
    }
    // mode === 'both'
    if (identifier.includes('@')) {
      return <Mail className="h-5 w-5 text-primary transition-colors" />;
    }
    if (/^\d+$/.test(identifier.replace(/[-\s]/g, '')) && identifier.length > 0) {
      return <CreditCard className="h-5 w-5 text-primary transition-colors" />;
    }
    return <Search className="h-5 w-5 text-slate-400" />;
  };

  const handleCheck = async () => {
    if (!identifier.trim()) {
      toast.error(modeContent.emptyToast);
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedCertIndex(0);
    setZoomMultiplier(1);

    try {
      const checkResult = await checkCertificateByICOrEmail(formId, identifier.trim());
      setResult(checkResult);
      setSelectedCertIndex(0);
      setZoomMultiplier(1);
    } catch {
      toast.error('Error verifying certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!hiddenCertificateRef.current || !result?.name) return;
    setDownloadingPng(true);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;

      // Orientation is derived from the active template dimensions.
      const tWidth = captureWidth;
      const tHeight = captureHeight;

      // Capture the hidden full-size certificate directly using onclone
      // This prevents the element from visually appearing on the user's screen during capturing
      const canvas = await html2canvas(hiddenCertificateRef.current, {
        scale: 3, // High quality HD
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tWidth,
        height: tHeight,
        // Prevent scroll offsets from injecting white gaps into the capture
        scrollY: 0,
        scrollX: 0,
        windowWidth: tWidth,
        windowHeight: tHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('hidden-print-container');
          if (el) {
            // Bring it into view ONLY inside the html2canvas cloned sandbox
            el.style.position = 'absolute';
            el.style.top = '0px';
            el.style.left = '0px';
            el.style.zIndex = '9999';
          }
        },
      });

      const certSuffix = activeDailyOption && !activeDailyOption.isCombined
        ? `_${activeDailyOption.label.replace(/\s+/g, '_')}`
        : '';
      const link = document.createElement('a');
      link.download = `Certificate_${result.name.replace(/\s+/g, '_')}${certSuffix}.png`;
      // For PNG, keeping full 1.0 quality as PNG is typically lossless anyway 
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success(
        `Certificate ${activeDailyOption ? `(${activeDailyOption.label}) ` : ''}PNG downloaded successfully!`
      );
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!hiddenCertificateRef.current || !result?.name) return;
    setDownloadingPdf(true);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      // Orientation is derived from the active template dimensions.
      const tWidth = captureWidth;
      const tHeight = captureHeight;

      // Capture the hidden full-size certificate directly
      // Using scale 3 is usually the "sweet spot" for HD text without crashing on mobile devices
      const canvas = await html2canvas(hiddenCertificateRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tWidth,
        height: tHeight,
        // Prevent scroll offsets from injecting white gaps into the capture
        scrollY: 0,
        scrollX: 0,
        windowWidth: tWidth,
        windowHeight: tHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('hidden-print-container');
          if (el) {
            // Bring it into view ONLY inside the html2canvas cloned sandbox
            el.style.position = 'absolute';
            el.style.top = '0px';
            el.style.left = '0px';
            el.style.zIndex = '9999';
          }
        },
      });

      // Parser dimensions to dictate jsPDF document mapping
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // To keep file size LOW but quality HIGH:
      // 1. High canvas scale (done above, scale: 3)
      // 2. High jpeg compression ratio (0.6 - 0.75 range) 
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Ensure 'FAST' or 'MEDIUM' compression alias is injected
      // Add generous +1 overlapping to prevent subpixel scaling rounding errors from revealing the white PDF background
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth + 2, pdfHeight + 2, undefined, 'FAST');
      const certSuffix = activeDailyOption && !activeDailyOption.isCombined
        ? `_${activeDailyOption.label.replace(/\s+/g, '_')}`
        : '';
      pdf.save(`Certificate_${result.name.replace(/\s+/g, '_')}${certSuffix}.pdf`);

      toast.success(
        `Certificate ${activeDailyOption ? `(${activeDailyOption.label}) ` : ''}PDF downloaded successfully!`
      );
    } catch (error) {
      console.error('PDF Download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 relative flex flex-col justify-between py-8 sm:py-12 md:py-16 px-4 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 max-w-3xl mx-auto">
          {/* Floating dual-ring badge */}
          <div className="relative inline-flex mb-4 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white shadow-xl shadow-primary/10 ring-1 ring-slate-900/5 flex items-center justify-center text-primary">
              <Award className="h-8 w-8 sm:h-9 sm:w-9 text-primary transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Portal tag badge */}
          <div className="flex items-center justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Semakan E-Sijil Rasmi</span>
            </span>
          </div>

          {/* Form Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight whitespace-pre-line break-words [text-wrap:balance]">
            {formTitle}
          </h1>
          <p className="text-slate-600 mt-2.5 text-sm sm:text-base [text-wrap:balance] max-w-xl mx-auto leading-relaxed">
            {modeContent.subtitle}
          </p>

          {minHoursRequired && minHoursRequired > 0 ? (
            <div className="mt-3.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Syarat Kehadiran: Minimum {minHoursRequired} Jam</span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Check Form - Center this if no result */}
        <div
          className={`transition-all duration-500 ${result?.found ? 'mb-8' : 'max-w-xl mx-auto'}`}
        >
          <Card className="border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-8 gap-5 bg-white/95 backdrop-blur-xl">
            <CardHeader className="p-0 gap-1.5">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                <FileText className="w-4 h-4" />
                <span>Pengesahan Sijil • Verification</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                Semakan Rekod Peserta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                {modeContent.cardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>{modeContent.label}</span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">{modeContent.example}</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {renderInputIcon()}
                  </div>
                  <Input
                    ref={inputRef}
                    id="ic"
                    type={modeContent.type}
                    inputMode={modeContent.inputMode}
                    placeholder={modeContent.placeholder}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                    className="h-13 pl-11 pr-10 text-base sm:text-lg rounded-2xl border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus-visible:ring-primary/20 shadow-xs transition-all"
                  />
                  {identifier.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('');
                        inputRef.current?.focus();
                      }}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Padam"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {mismatchWarning ? (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-1.5 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>{mismatchWarning}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                    <span>💡</span>
                    <span>{modeContent.hint}</span>
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-0">
              <Button
                onClick={handleCheck}
                disabled={loading}
                className="w-full h-13 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary via-primary/95 to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Mengesahkan Rekod...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Sahkan E-Sijil Sekarang
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Result Section */}
        {result?.found && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
            {/* Left: Result Details */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border border-emerald-100 shadow-xl rounded-3xl p-0 gap-0 overflow-hidden bg-gradient-to-b from-emerald-50/90 via-emerald-50/40 to-white">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100/90 text-emerald-600 shadow-2xs border border-emerald-200/70 mb-3">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950 mb-0.5">Certificate Found!</h3>
                  <p className="text-xs text-emerald-700/90 mb-4">Participant record verified</p>

                  <div className="text-left bg-white/95 p-4 rounded-xl border border-emerald-100 shadow-2xs text-sm space-y-3 mb-5">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-0.5">
                        Name
                      </span>
                      <span className="font-medium text-slate-900 break-words block leading-snug">
                        {result.name}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-0.5">
                        Program
                      </span>
                      <span className="font-medium text-slate-900 break-words block leading-snug [text-wrap:balance]">
                        {result.programName}
                      </span>
                    </div>
                    {formattedDate && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-0.5">
                          Date
                        </span>
                        <span className="font-medium text-slate-900 block">
                          {formattedDate}
                        </span>
                      </div>
                    )}

                    {dailyOptions && (
                      <div className="pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pilihan Sijil Kehadiran</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 font-medium px-2 py-0.5 rounded-full">
                            {dailyOptions.length} Sijil
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dailyOptions.map((opt, idx) => {
                            const isSelected = selectedCertIndex === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedCertIndex(idx)}
                                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-700 font-semibold shadow-2xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <Award
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSelected ? 'text-white' : 'text-emerald-600'
                                    }`}
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </span>
                                <span
                                  className={`text-[10px] shrink-0 ${
                                    isSelected ? 'text-emerald-100 font-normal' : 'text-slate-500'
                                  }`}
                                >
                                  {opt.formattedDate}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={downloadingPdf || downloadingPng}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    >
                      {downloadingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadPNG}
                      disabled={downloadingPdf || downloadingPng}
                      variant="outline"
                      className="w-full h-11 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium rounded-xl transition-all active:scale-[0.98]"
                    >
                      {downloadingPng ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PNG...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download PNG
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Certificate Preview */}
            <div className="md:col-span-2">
              <Card className="border border-slate-200/80 shadow-xl rounded-3xl p-0 gap-0 overflow-hidden bg-white">
                <CardHeader className="px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200/80 flex flex-row items-center justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900 leading-none">
                          Live Preview
                        </CardTitle>
                        {activeDailyOption && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                            {activeDailyOption.label}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ready
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {isPortrait ? 'Portrait (A4)' : 'Landscape (A4)'} • High Resolution
                        {activeCertDate ? ` • ${formattedDate || activeCertDate}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Toolbar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoomMultiplier((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)))}
                      disabled={zoomMultiplier <= 0.6}
                      title="Zoom Out"
                      className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomMultiplier(1)}
                      title="Reset to Fit"
                      className="h-8 px-2.5 text-xs font-medium rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-w-[42px]"
                    >
                      {zoomMultiplier === 1 ? 'Fit' : `${Math.round(zoomMultiplier * 100)}%`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setZoomMultiplier((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)))}
                      disabled={zoomMultiplier >= 2.0}
                      title="Zoom In"
                      className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFullscreenOpen(true)}
                      title="Full Screen Preview"
                      className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                {dailyOptions && (
                  <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="text-xs font-semibold text-slate-600 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pilih Sijil:</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dailyOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCertIndex(idx)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            selectedCertIndex === idx
                              ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label} ({opt.formattedDate})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <CardContent className="p-0 bg-slate-100/90 relative overflow-hidden">
                  {/* Stable measurement wrapper - ref here so available width is consistent */}
                  <div ref={previewWrapperRef} className="w-full">
                    {/* Modern Studio Workbench canvas with subtle dot grid */}
                    <div
                      className="flex justify-center items-center w-full min-h-[480px] sm:min-h-[560px] max-h-[72vh] overflow-auto py-8 px-4 select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
                      style={{
                        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    >
                      {/* Outer frame that tracks the actual scaled dimensions */}
                      <div
                        className="relative m-auto transition-[width,height] duration-200 ease-out"
                        style={{
                          width: `${Math.round(captureWidth * effectiveScale)}px`,
                          height: `${Math.round(captureHeight * effectiveScale)}px`,
                        }}
                      >
                        {/* Full-size certificate scaled down via transform */}
                        <div
                          className="absolute top-0 left-0 origin-top-left rounded-[3px] bg-white ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.16),0_4px_16px_rgba(0,0,0,0.08)]"
                          style={{
                            width: `${captureWidth}px`,
                            height: `${captureHeight}px`,
                            transform: `scale(${effectiveScale})`,
                          }}
                        >
                          <div ref={certificateRef} className="w-full h-full">
                            <CertificateTemplate
                              type={templateId || 'classic'}
                              name={result.name || ''}
                              program={formTitle || ''}
                              date={activeCertDate}
                              id="check-preview"
                              customTemplateData={activeTemplate}
                              ic={result.ic || (identifier.includes('@') ? '' : identifier)}
                              formId={formId}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Verified e-Certificate • Ready for instant download</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{captureWidth} × {captureHeight}px</span>
                    <span>•</span>
                    <span className="font-mono">300 DPI Output</span>
                  </div>
                </CardFooter>
              </Card>

              <p className="text-center text-xs text-muted-foreground mt-2.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Authentic certificate verified directly from organizer database</span>
              </p>
            </div>

            {/* Hidden Full-Size Certificate for PDF/PNG Capture - Exactly as Rendered */}
            <div
              ref={hiddenCertificateRef}
              id="hidden-print-container"
              style={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: `${captureWidth}px`,
                height: `${captureHeight}px`,
                zIndex: -1,
                overflow: 'hidden',
              }}
            >
              <CertificateTemplate
                type={templateId || 'classic'}
                name={result.name || ''}
                program={formTitle || ''}
                date={activeCertDate}
                id="hidden-certificate"
                customTemplateData={activeTemplate}
                ic={result.ic || (identifier.includes('@') ? '' : identifier)}
                formId={formId}
              />
            </div>
          </div>
        )}

        {result && !result.found && (
          <div className="max-w-xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
            {result.attendanceIneligible && result.attendanceDetails ? (
              <Card className="border border-amber-200/90 shadow-xl shadow-amber-500/5 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 rounded-3xl p-6 sm:p-7">
                <CardContent className="p-0 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200/80 mb-1 shadow-2xs">
                    <Clock className="h-7 w-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-950 mb-1.5">
                      {result.attendanceDetails.status === 'not_checked_out'
                        ? 'Daftar Keluar (Check-Out) Belum Lengkap'
                        : result.attendanceDetails.status === 'no_record'
                        ? 'Tiada Rekod Kehadiran Ditemui'
                        : 'Syarat Jam Kehadiran Tidak Mencukupi'}
                    </h3>
                    <p className="text-xs text-amber-900/90 max-w-md mx-auto leading-relaxed">
                      {result.error}
                    </p>
                  </div>

                  <div className="bg-white/95 p-4 rounded-2xl border border-amber-200/80 text-left text-xs space-y-2 max-w-sm mx-auto shadow-2xs">
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                      <span className="text-muted-foreground">Syarat Jam Minimum:</span>
                      <span className="font-bold text-slate-900">{result.attendanceDetails.requiredHours} Jam</span>
                    </div>
                    {result.attendanceDetails.status === 'insufficient_hours' && (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-amber-100">
                          <span className="text-muted-foreground">Jumlah Kehadiran Anda:</span>
                          <span className="font-bold text-amber-800">{result.attendanceDetails.attendedFormatted}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground">Kekurangan:</span>
                          <span className="font-bold text-rose-600">Kurang {result.attendanceDetails.shortfallText}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-amber-800/80 italic">
                    Sila hubungi pihak urusetia / penganjur program sekiranya anda mempunyai kebenaran khas atau pengecualian.
                  </p>
                </CardContent>
              </Card>
            ) : result.missingField === 'email' || result.error?.toLowerCase().includes('email field not found') ? (
              /* Missing Email column in Google Sheet */
              <Card className="border border-amber-200/90 shadow-xl shadow-amber-500/5 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 rounded-3xl p-6 sm:p-7 text-center">
                <CardContent className="p-0 space-y-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200/80 mb-1 shadow-2xs">
                    <AlertCircle className="h-7 w-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Carian E-mel Tidak Tersedia
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Rekod kehadiran bagi borang ini menggunakan <strong>Nombor Kad Pengenalan (No. IC)</strong> sebagai pengenalan utama. Sila gunakan No. IC anda untuk menyemak sijil.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setIdentifier('');
                        setResult(null);
                        inputRef.current?.focus();
                      }}
                      className="h-11 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md shadow-amber-600/20 text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gunakan Nombor Kad Pengenalan (No. IC)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : result.missingField === 'ic' || result.error?.toLowerCase().includes('ic field not found') ? (
              /* Missing IC column in Google Sheet */
              <Card className="border border-blue-200/90 shadow-xl shadow-blue-500/5 bg-gradient-to-b from-blue-50/90 via-white to-blue-50/30 rounded-3xl p-6 sm:p-7 text-center">
                <CardContent className="p-0 space-y-3">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200/80 mb-1 shadow-2xs">
                    <Mail className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Carian No. IC Tidak Tersedia
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Rekod kehadiran bagi borang ini menggunakan <strong>Alamat E-mel</strong> sebagai pengenalan utama. Sila gunakan alamat e-mel anda untuk menyemak sijil.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setIdentifier('');
                        setResult(null);
                        inputRef.current?.focus();
                      }}
                      className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20 text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Gunakan Alamat E-mel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Participant Not Found */
              <Card className="border border-rose-200/80 shadow-xl shadow-rose-500/5 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/20 rounded-3xl p-6 sm:p-7 text-center">
                <CardContent className="p-0 space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200/80 mb-1 shadow-2xs">
                    <XCircle className="h-7 w-7 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Rekod Sijil Tidak Ditemui
                    </h3>
                    <p className="text-xs sm:text-sm text-rose-800/90 max-w-md mx-auto leading-relaxed">
                      Tiada rekod kehadiran dijumpai untuk carian{' '}
                      <span className="font-semibold text-rose-950 font-mono bg-rose-100/80 px-2 py-0.5 rounded-md">
                        {identifier}
                      </span>.
                    </p>
                  </div>

                  <div className="bg-white/95 p-4 rounded-2xl border border-rose-100/90 text-left text-xs space-y-2 max-w-md mx-auto shadow-2xs text-slate-600">
                    <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Panduan & Tindakan:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed text-xs">
                      {mode === 'email_only' ? (
                        <>
                          <li>Pastikan alamat e-mel dieja dengan tepat seperti semasa mengisi borang program.</li>
                          <li>Periksa ejaan domain e-mel anda (contoh: <code>@gmail.com</code>, <code>@yahoo.com</code>).</li>
                          <li>Sila hubungi pihak urusetia / penganjur jika kehadiran anda belum dimuat naik ke dalam sistem.</li>
                        </>
                      ) : mode === 'ic_only' ? (
                        <>
                          <li>Pastikan No. Kad Pengenalan dimasukkan tanpa tanda sempang (contoh: <code>901020015566</code>).</li>
                          <li>Semak semula 12 digit nombor kad pengenalan anda.</li>
                          <li>Sila hubungi pihak urusetia / penganjur jika kehadiran anda belum dimuat naik ke dalam sistem.</li>
                        </>
                      ) : (
                        <>
                          <li>Pastikan No. Kad Pengenalan dimasukkan tanpa tanda sempang (contoh: <code>901020015566</code>).</li>
                          <li>Pastikan alamat e-mel dieja dengan tepat seperti semasa mengisi borang program.</li>
                          <li>Sila hubungi pihak urusetia / penganjur jika kehadiran anda belum dimuat naik ke dalam sistem.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setIdentifier('');
                        setResult(null);
                        inputRef.current?.focus();
                      }}
                      variant="outline"
                      className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Cuba Carian Baharu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Fullscreen HD Preview Modal */}
        <Dialog open={isFullscreenOpen} onOpenChange={(open) => {
          setIsFullscreenOpen(open);
          if (open) setModalZoomMultiplier(1);
        }}>
          <DialogContent
            showCloseButton={true}
            className="max-w-5xl w-[95vw] max-h-[94vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-950 border-slate-800 text-white rounded-2xl shadow-2xl"
          >
            <DialogHeader className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-row items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Award className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-semibold text-white flex items-center gap-2 flex-wrap">
                  <span>Certificate Full HD Preview</span>
                  {activeDailyOption && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-normal">
                      {activeDailyOption.label} • {activeDailyOption.formattedDate}
                    </span>
                  )}
                </DialogTitle>
              </div>

              {/* Modal Zoom Controls */}
              <div className="flex items-center gap-1.5 mr-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalZoomMultiplier((prev) => Math.max(0.6, +(prev - 0.2).toFixed(2)))}
                  disabled={modalZoomMultiplier <= 0.6}
                  title="Zoom Out"
                  className="h-8 w-8 rounded-lg border border-slate-750 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalZoomMultiplier((prev) => (prev === 1 ? 1.5 : 1))}
                  title={modalZoomMultiplier === 1 ? 'Zoom to 150%' : 'Reset to Fit'}
                  className="h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-750 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 min-w-[42px]"
                >
                  {modalZoomMultiplier === 1 ? 'Fit' : `${Math.round(modalZoomMultiplier * 100)}%`}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalZoomMultiplier((prev) => Math.min(2.5, +(prev + 0.2).toFixed(2)))}
                  disabled={modalZoomMultiplier >= 2.5}
                  title="Zoom In"
                  className="h-8 w-8 rounded-lg border border-slate-750 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950 select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain">
              {result?.found && (() => {
                const baseModalScale =
                  typeof window !== 'undefined'
                    ? Math.min(
                        (window.innerWidth * 0.82) / captureWidth,
                        Math.max(0.2, (window.innerHeight * 0.86 - 150) / captureHeight)
                      )
                    : 0.65;
                const effectiveModalScale = baseModalScale * modalZoomMultiplier;
                return (
                  <div
                    className="relative m-auto transition-[width,height] duration-200 ease-out rounded-[3px] bg-white shadow-2xl ring-1 ring-white/10"
                    style={{
                      width: `${Math.round(captureWidth * effectiveModalScale)}px`,
                      height: `${Math.round(captureHeight * effectiveModalScale)}px`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 origin-top-left bg-white"
                      style={{
                        width: `${captureWidth}px`,
                        height: `${captureHeight}px`,
                        transform: `scale(${effectiveModalScale})`,
                      }}
                    >
                      <CertificateTemplate
                        type={templateId || 'classic'}
                        name={result.name || ''}
                        program={formTitle || ''}
                        date={activeCertDate}
                        id="dialog-preview"
                        customTemplateData={activeTemplate}
                        ic={result.ic || (identifier.includes('@') ? '' : identifier)}
                        formId={formId}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Crystal Clear HD Render</span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf || downloadingPng}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold rounded-lg shadow-xs"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadPNG}
                  disabled={downloadingPdf || downloadingPng}
                  className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 h-8 text-xs font-semibold rounded-lg shadow-xs"
                >
                  {downloadingPng ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-slate-800" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5 text-slate-800" />
                      Download PNG
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Official Verification Footer */}
      <footer className="mt-12 sm:mt-16 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-slate-200/70 max-w-6xl mx-auto w-full">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Sistem Pengesahan E-Sijil Digital Selamat • Dikuasakan oleh <strong className="text-slate-700 font-semibold">KlikForm</strong></span>
      </footer>
    </div>
  );
}
