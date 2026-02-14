'use client';

import { useState } from 'react';
import { QrCustomizer } from '@/components/forms/qr-customizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { QrSettings } from '@/components/forms/qr-customizer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrUpdateQRCode } from '@/actions/qr-codes';
import { QRCode } from '@/lib/types/qr-codes';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

interface QrBuilderClientProps {
  initialData?: QRCode;
}

export default function QrBuilderClient({ initialData }: QrBuilderClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || 'Untitled QR');
  const [url, setUrl] = useState(initialData?.content || 'https://klikform.com');
  const [settings, setSettings] = useState<QrSettings>(initialData?.settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createOrUpdateQRCode(initialData?.id, title, url, settings);

      if (res.success) {
        toast.success('QR Code saved successfully');
        if (!initialData?.id) {
          router.push(`/qr-builder/${res.id}`); // Redirect to edit mode
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/qr-builder">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <Input
              id="qr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold h-8 border-transparent hover:border-input focus:border-input px-2 -ml-2 transition-all bg-transparent w-full max-w-sm"
              placeholder="Untitled QR"
            />
            <span className="text-xs text-muted-foreground px-0.5">
              {initialData?.id ? 'Edit QR Code' : 'Create New QR'}
            </span>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 md:p-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Configurations */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>What should this QR code scan to?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-url">Website URL / Text</Label>
                    <Input
                      id="qr-url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-8">
            <Card className="h-full border-0 shadow-none bg-transparent lg:border lg:shadow-sm lg:bg-card">
              <CardHeader className="px-0 lg:px-6">
                <CardTitle>Design & Preview</CardTitle>
                <CardDescription>Customize colors, shapes, and logo.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 lg:px-6">
                <QrCustomizer
                  url={url || 'https://klikform.com'}
                  settings={settings}
                  onSettingsChange={setSettings}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
