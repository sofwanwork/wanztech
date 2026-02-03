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
import { checkCertificateByIC, CertificateCheckResult } from '@/actions/certificate';
import { useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { CertificateTemplate } from '@/components/certificate-template';
import { toast } from 'sonner';

import { CertificateTemplate as CertificateTemplateType } from '@/lib/types';

interface CertificateCheckClientProps {
  formId: string;
  formTitle: string;
  templateId?: string;
  customTemplateData?: CertificateTemplateType | null;
}

// Template URL mappings
const TEMPLATE_URLS: Record<string, string> = {
  classic: '/templates/cert_classic_1769780543340.png',
  modern: '/templates/cert_modern_1769780573939.png',
  elegant: '/templates/cert_elegant_1769780598518.png',
  corporate: '/templates/cert_corporate_1769780629083.png',
  creative: '/templates/cert_creative_1769780649445.png',
};

export function CertificateCheckClient({
  formId,
  formTitle,
  templateId,
  customTemplateData,
}: CertificateCheckClientProps) {
  const [ic, setIC] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateCheckResult | null>(null);

  const certificateRef = useRef<HTMLDivElement>(null);
  const hiddenCertificateRef = useRef<HTMLDivElement>(null);

  const handleCheck = async () => {
    if (!ic.trim()) {
      toast.error('Sila masukkan nombor IC');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const checkResult = await checkCertificateByIC(formId, ic.trim());
      setResult(checkResult);
    } catch (error) {
      toast.error('Ralat semasa menyemak sijil');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!hiddenCertificateRef.current || !result?.name) return;

    try {
      // Capture the hidden full-size certificate directly (no cloning needed)
      const canvas = await html2canvas(hiddenCertificateRef.current, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
      });

      const link = document.createElement('a');
      link.download = `Certificate_${result.name.replace(/\s+/g, '_')}.png`;
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
      // Capture the hidden full-size certificate directly (no cloning needed)
      const canvas = await html2canvas(hiddenCertificateRef.current, {
        scale: 2, // Good balance of quality and size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
      });

      // A4 landscape dimensions in mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Use JPEG with high quality (0.9) to reduce file size significantly while keeping good resolution
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Stretch to fill entire page (no white borders)
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
                Enter your IC number to verify and download certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic">IC Number</Label>
                <Input
                  id="ic"
                  placeholder="Example: 901234-56-7890"
                  value={ic}
                  onChange={(e) => setIC(e.target.value)}
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
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-gray-200">
                  {/* Scroll wrapper for mobile */}
                  <div className="flex justify-center w-full bg-gray-200 py-8 px-4 overflow-visible">
                    {/* Responsive Height Wrapper - eliminating ghost space */}
                    <div className="relative w-full h-[230px] sm:h-[397px] md:h-[360px] lg:h-[420px] xl:h-[480px] transition-all duration-300">
                      {/* Scaled ID Card - Absolute Positioned */}
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 origin-top shadow-2xl scale-[0.28] sm:scale-[0.5] md:scale-[0.45] lg:scale-[0.52] xl:scale-[0.6] transition-transform"
                        style={{ width: '1123px', height: '794px' }}
                      >
                        <div ref={certificateRef} className="w-full h-full">
                          <CertificateTemplate
                            type={templateId || 'classic'}
                            name={result.name || ''}
                            program={formTitle || ''}
                            date={result.date}
                            id="check-preview"
                            customTemplateData={customTemplateData}
                          />
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
              style={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '1123px',
                height: '794px',
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
                customTemplateData={customTemplateData}
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
                <p className="text-red-600">{result.error || 'IC not found in records'}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
