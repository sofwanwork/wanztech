'use client';

import { useState, useEffect } from 'react';
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
import { Award, Search, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { checkCertificateByICOrEmail, CertificateCheckResult } from '@/actions/certificates';
import { useRef } from 'react';
// import html2canvas from 'html2canvas-pro';
// import { jsPDF } from 'jspdf';
import { CertificateTemplate } from '@/components/certificate-template';
import { toast } from 'sonner';
import { resolveCategoryTemplateId } from '@/lib/certificates/category';

import {
  CertificateTemplate as CertificateTemplateType,
  CertificateCategoryConfig,
} from '@/lib/types';

interface CertificateCheckClientProps {
  formId: string;
  formTitle: string;
  templateId?: string;
  customTemplateData?: CertificateTemplateType | null;
  /** Category → template mapping (when configured on the form). */
  categoryConfig?: CertificateCategoryConfig | null;
  /** All prefetched templates keyed by id (default + mapped categories). */
  templatesById?: Record<string, CertificateTemplateType>;
}

export function CertificateCheckClient({
  formId,
  formTitle,
  templateId,
  customTemplateData,
  categoryConfig,
  templatesById,
}: CertificateCheckClientProps) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateCheckResult | null>(null);

  const certificateRef = useRef<HTMLDivElement>(null);
  const hiddenCertificateRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

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
      const available = wrapper.clientWidth - 32; // subtract px-4 padding (16px * 2)
      if (available <= 0) return;
      const maxHeight = Math.min(520, window.innerHeight * 0.6);
      const fitWidth = available / captureWidth;
      const fitHeight = maxHeight / captureHeight;
      setPreviewScale(Math.min(fitWidth, fitHeight));
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

  const handleCheck = async () => {
    if (!identifier.trim()) {
      toast.error('Sila masukkan nombor IC atau Email');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const checkResult = await checkCertificateByICOrEmail(formId, identifier.trim());
      setResult(checkResult);
    } catch {
      toast.error('Ralat semasa menyemak sijil');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!hiddenCertificateRef.current || !result?.name) return;

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

      const link = document.createElement('a');
      link.download = `Certificate_${result.name.replace(/\s+/g, '_')}.png`;
      // For PNG, keeping full 1.0 quality as PNG is typically lossless anyway 
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success('Certificate PNG downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleDownloadPDF = async () => {
    if (!hiddenCertificateRef.current || !result?.name) return;

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
      pdf.save(`Certificate_${result.name.replace(/\s+/g, '_')}.pdf`);

      toast.success('Certificate PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{formTitle}</h1>
          <p className="text-gray-600 mt-2">Verify & Download Your E-Certificate</p>
        </div>

        {/* Check Form - Center this if no result yes */}
        <div
          className={`transition-all duration-500 ${result?.found ? 'mb-8' : 'max-w-lg mx-auto'}`}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Certificate Verification</CardTitle>
              <CardDescription>
                Enter your IC number or Email to verify and download certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic">IC Number / Email</Label>
                <Input
                  id="ic"
                  placeholder="Example: 901234567890 or email@domain.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  className="h-12 text-lg"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCheck} disabled={loading} className="w-full h-12">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Result Section */}
        {result?.found && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left: Result Details */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border-0 shadow-lg bg-green-50">
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Certificate Found!</h3>
                  <div className="text-left bg-white/50 p-4 rounded-lg text-sm space-y-2 mb-4">
                    <div>
                      <span className="font-medium text-green-800 block">Name:</span>
                      <span className="text-gray-900">{result.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800 block">Program:</span>
                      <span className="text-gray-900">{result.programName}</span>
                    </div>
                    {result.date && (
                      <div>
                        <span className="font-medium text-green-800 block">Date:</span>
                        <span className="text-gray-900">{result.date}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleDownloadPDF}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={handleDownloadPNG}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PNG
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Certificate Preview */}
            <div className="md:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-gray-200">
                  {/* Stable measurement wrapper - ref here so available width is consistent */}
                  <div ref={previewWrapperRef} className="w-full">
                    {/* Center the scaled certificate with padding */}
                    <div className="flex justify-center w-full bg-gray-200 py-8 px-4">
                      {/* Outer frame that tracks the actual scaled dimensions */}
                      <div
                        className="relative"
                        style={{
                          width: `${captureWidth * previewScale}px`,
                          height: `${captureHeight * previewScale}px`,
                        }}
                      >
                        {/* Full-size certificate scaled down via transform */}
                        <div
                          className="absolute top-0 left-0 origin-top-left shadow-2xl"
                          style={{
                            width: `${captureWidth}px`,
                            height: `${captureHeight}px`,
                            transform: `scale(${previewScale})`,
                          }}
                        >
                          <div ref={certificateRef} className="w-full h-full">
                            <CertificateTemplate
                              type={templateId || 'classic'}
                              name={result.name || ''}
                              program={formTitle || ''}
                              date={result.date}
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
              </Card>
              <p className="text-center text-xs text-muted-foreground mt-2">
                * Download link will save the image as displayed above
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
                date={result.date}
                id="hidden-certificate"
                customTemplateData={activeTemplate}
                ic={result.ic || (identifier.includes('@') ? '' : identifier)}
                formId={formId}
              />
            </div>
          </div>
        )}

        {result && !result.found && (
          <div className="max-w-lg mx-auto">
            <Card className="border-0 shadow-lg bg-red-50">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Certificate Not Found</h3>
                <p className="text-red-600">{result.error || 'IC / Email not found in records'}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
