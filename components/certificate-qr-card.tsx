'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CertificateQrCardProps {
  formId: string;
  formTitle: string;
  templateName: string;
}

export function CertificateQrCard({ formId, formTitle, templateName }: CertificateQrCardProps) {
  const [downloading, setDownloading] = useState(false);
  const checkUrl = `/check/${formId}`;

  // High resolution QR (500x500)
  const qrUrlPreview = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(checkUrl)}`;
  const qrUrlHighRes = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(checkUrl)}`;

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Fetch the high-res QR code
      const response = await fetch(qrUrlHighRes);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-semakan-sijil-${formTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('QR Code dimuat turun! (1000x1000px)');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal memuat turun QR Code');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{formTitle}</CardTitle>
        <CardDescription>Template: {templateName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code for verification */}
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrlPreview}
            alt="Certificate Verification QR Code"
            width={150}
            height={150}
            className="rounded"
          />
        </div>

        {/* Download Button */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {downloading ? 'Memuat turun...' : 'Download QR (High Res)'}
        </Button>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Certificate Verification Link:</p>
          <code className="text-xs bg-gray-100 p-2 rounded block break-all">{checkUrl}</code>
        </div>

        <div className="flex gap-2">
          <Link href={checkUrl} className="flex-1" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka
            </Button>
          </Link>
          <Link href={`/builder/${formId}`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
