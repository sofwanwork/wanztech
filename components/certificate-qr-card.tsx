'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

interface CertificateQrCardProps {
  formId: string;
  formTitle: string;
  templateName: string;
}

export function CertificateQrCard({ formId, formTitle, templateName }: CertificateQrCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [origin, setOrigin] = useState('');
  const highResRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const checkUrl = `${origin}/check/${formId}`;

  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true);

      // Find the hidden high-res canvas and export it
      const canvas = highResRef.current?.querySelector('canvas');
      if (!canvas) {
        toast.error('QR Code not ready');
        return;
      }

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-semakan-sijil-${formTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('QR Code dimuat turun! (1000x1000px)');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal memuat turun QR Code');
    } finally {
      setDownloading(false);
    }
  }, [formTitle]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{formTitle}</CardTitle>
        <CardDescription>Template: {templateName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Preview (client-side generated) */}
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          {origin ? (
            <QRCodeCanvas
              value={checkUrl}
              size={150}
              level="M"
              marginSize={2}
            />
          ) : (
            <div className="w-[150px] h-[150px] rounded bg-gray-100 animate-pulse" />
          )}
        </div>

        {/* Hidden high-res QR for download */}
        {origin && (
          <div ref={highResRef} className="hidden">
            <QRCodeCanvas
              value={checkUrl}
              size={1000}
              level="H"
              marginSize={2}
            />
          </div>
        )}

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
