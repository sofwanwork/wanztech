'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, Image as ImageIcon, PaintBucket, Shapes, Loader2 } from 'lucide-react';
import type QRCodeStyling from 'qr-code-styling';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/image-compression';
import { v4 as uuidv4 } from 'uuid';

export interface QrSettings {
  dotsColor?: string;
  dotsType?: string;
  cornersColor?: string;
  cornersType?: string;
  backgroundColor?: string;
  logo?: string;
}

export interface QrCustomizerProps {
  url: string;
  settings?: QrSettings;
  onSettingsChange?: (settings: QrSettings) => void;
}

type DotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
type CornerSquareType = 'square' | 'dot' | 'extra-rounded';

export function QrCustomizer({ url, settings, onSettingsChange }: QrCustomizerProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Use props or default values
  const dotsColor = settings?.dotsColor || '#000000';
  const dotsType = (settings?.dotsType as DotType) || 'square';
  const cornersColor = settings?.cornersColor || '#000000';
  const cornersType = (settings?.cornersType as CornerSquareType) || 'square';
  const backgroundColor = settings?.backgroundColor || '#ffffff';
  const logo = settings?.logo;

  // Helper to update specific setting
  const updateSetting = (key: keyof QrSettings, value: string | undefined) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        [key]: value,
      });
    }
  };

  // Initialize Supabase client
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);

  // Initialize QR Code Styling
  useEffect(() => {
    import('qr-code-styling').then((QRCodeStylingConstructor) => {
      const QRCodeStyling = QRCodeStylingConstructor.default;
      const qr = new QRCodeStyling({
        width: 300,
        height: 300,
        type: 'svg',
        data: url,
        image: logo,
        dotsOptions: {
          color: dotsColor,
          type: dotsType,
        },
        cornersSquareOptions: {
          color: cornersColor,
          type: cornersType,
        },
        backgroundOptions: {
          color: backgroundColor,
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 10,
        },
      });
      setQrCode(qr);
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
        qr.append(qrRef.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to init

  // Update QR when options change
  useEffect(() => {
    if (!qrCode) return;
    qrCode.update({
      data: url,
      image: logo,
      dotsOptions: {
        color: dotsColor,
        type: dotsType,
        // @ts-expect-error gradient is a valid option but not typed
        gradient: null, // Reset gradient if needed
      },
      cornersSquareOptions: {
        color: cornersColor,
        type: cornersType,
      },
      backgroundOptions: {
        color: backgroundColor,
      },
    });
  }, [qrCode, url, logo, dotsColor, dotsType, cornersColor, cornersType, backgroundColor]);

  const deleteOldLogo = async (url: string) => {
    try {
      // url example: .../storage/v1/object/public/qr_logos/user_id/filename.png
      const bucketName = 'qr_logos';
      const parts = url.split(`/${bucketName}/`);
      if (parts.length === 2) {
        const path = parts[1];
        await supabase.storage.from(bucketName).remove([path]);
      }
    } catch (e) {
      console.warn('Failed to cleanup old logo:', e);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const oldLogoUrl = settings?.logo;

      try {
        setIsUploading(true);
        // Show local preview immediately using Base64 for responsiveness
        // But also kick off upload
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setLogoPreview(event.target.result as string);
            // Also set as logo temporarily so user sees it change immediately
            // setLogo(event.target.result as string); // Removed: Use logoPreview
          }
        };
        reader.readAsDataURL(file);

        // 1. Compress Image
        const compressedFile = await compressImage(file, 1); // Max 1MB limit

        // 2. Generate path
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;

        // 3. Get user user_id for folder structure (if authenticated)
        // Since this is client side, we use getUser()
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const dir = user ? user.id : 'public';
        const filePath = `${dir}/${fileName}`;

        // 4. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('qr_logos')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 5. Get Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('qr_logos').getPublicUrl(filePath);

        // 6. Update Logo State with the PERMANENT URL
        updateSetting('logo', publicUrl);
        setLogoPreview(publicUrl);

        toast.success('Logo uploaded & saved!');

        // 7. Cleanup old logo if it exists
        if (oldLogoUrl) {
          await deleteOldLogo(oldLogoUrl);
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to save logo to cloud');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveLogo = async () => {
    const oldLogoUrl = settings?.logo;
    updateSetting('logo', undefined);
    setLogoPreview(null);
    // setLogo(undefined); // Removed

    if (oldLogoUrl) {
      await deleteOldLogo(oldLogoUrl);
      toast.success('Logo removed from storage');
    }
  };

  const handleDownload = async (format: 'png' | 'svg', resolution: number = 1000) => {
    if (!qrCode) return;
    try {
      // Temporarily update size for high-res download
      if (format === 'png' && resolution > 300) {
        await qrCode.update({ width: resolution, height: resolution });
      }

      await qrCode.download({
        name: 'custom-qr-code',
        extension: format,
      });

      toast.success(`QR Code downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download QR Code');
    } finally {
      // Revert preview size
      if (format === 'png' && resolution > 300 && qrCode) {
        await qrCode.update({ width: 300, height: 300 });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8">
      {/* Controls */}
      <div className="space-y-6">
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-9 p-1">
            <TabsTrigger value="style" className="px-3 text-sm data-[state=active]:bg-background">
              <Shapes className="h-4 w-4 mr-0" />
              Style
            </TabsTrigger>
            <TabsTrigger value="colors" className="px-3 text-sm data-[state=active]:bg-background">
              <PaintBucket className="h-4 w-4 mr-0" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="logo" className="px-3 text-sm data-[state=active]:bg-background">
              <ImageIcon className="h-4 w-4 mr-0" />
              Logo
            </TabsTrigger>
          </TabsList>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="dots-style">Dots Style</Label>
              <Select value={dotsType} onValueChange={(v) => updateSetting('dotsType', v)}>
                <SelectTrigger id="dots-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                  <SelectItem value="classy">Classy</SelectItem>
                  <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="corners-style">Corners Style</Label>
              <Select value={cornersType} onValueChange={(v) => updateSetting('cornersType', v)}>
                <SelectTrigger id="corners-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="dot">Dot</SelectItem>
                  <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="dots-color">Dots Color</Label>
              <div className="flex gap-2">
                <Input
                  id="dots-color"
                  type="color"
                  value={dotsColor}
                  onChange={(e) => updateSetting('dotsColor', e.target.value)}
                  className="h-10 w-20 p-1 cursor-pointer"
                />
                <Input
                  aria-label="Dots Color Hex"
                  value={dotsColor}
                  onChange={(e) => updateSetting('dotsColor', e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="corners-color">Corners Color</Label>
              <div className="flex gap-2">
                <Input
                  id="corners-color"
                  type="color"
                  value={cornersColor}
                  onChange={(e) => updateSetting('cornersColor', e.target.value)}
                  className="h-10 w-20 p-1 cursor-pointer"
                />
                <Input
                  aria-label="Corners Color Hex"
                  value={cornersColor}
                  onChange={(e) => updateSetting('cornersColor', e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="h-10 w-20 p-1 cursor-pointer"
                />
                <Input
                  aria-label="Background Color Hex"
                  value={backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </TabsContent>

          {/* Logo Tab */}
          <TabsContent value="logo" className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Upload Logo (Optional)
              </p>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={handleLogoUpload}
                  />
                  <Button asChild variant="outline" disabled={isUploading}>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Label>
                  </Button>
                </div>
                {(logoPreview || logo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {(logoPreview || logo) && (
                <div className="mt-2 w-20 h-20 border rounded p-1 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview || logo}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center space-y-6">
        <Card className="p-6 bg-white border shadow-sm w-full overflow-hidden">
          <div
            ref={qrRef}
            className="flex justify-center items-center [&>svg]:max-w-full [&>svg]:h-auto [&>canvas]:max-w-full [&>canvas]:h-auto"
          />
        </Card>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={() => handleDownload('png', 2000)} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download High Res PNG
          </Button>
          <Button onClick={() => handleDownload('svg')} variant="outline" className="w-full">
            <ImageIcon className="h-4 w-4 mr-2" /> Download SVG (Vector)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center px-4">
          High Res PNG is 2000x2000px, perfect for banners and posters.
        </p>
      </div>
    </div>
  );
}
