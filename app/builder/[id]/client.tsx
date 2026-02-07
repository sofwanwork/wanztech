'use client';

import { useState, useEffect } from 'react';
import { Form, CertificateTemplate as CertificateTemplateType } from '@/lib/types';
import { updateFormAction, deleteFormAction } from '@/actions/forms';
import { FieldsEditor } from '@/components/forms/fields-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Trash,
  ExternalLink,
  Download,
  Copy,
  Award,
  Info,
  Plus,
  FileImage,
  Settings2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { getProxiedImageUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { QrCustomizer } from '@/components/forms/qr-customizer';

interface BuilderClientProps {
  initialForm: Form;
  userCertificates: CertificateTemplateType[];
}

export function BuilderClient({ initialForm, userCertificates }: BuilderClientProps) {
  const [form, setForm] = useState<Form>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [publicUrl, setPublicUrl] = useState(`/form/${initialForm.id}`);

  useEffect(() => {
    setMounted(true);
    if (form.shortCode) {
      setPublicUrl(`${window.location.origin}/s/${form.shortCode}`);
    } else {
      setPublicUrl(`${window.location.origin}/form/${form.id}`);
    }
  }, [form.id, form.shortCode]);

  // Auto-save QR Settings (Debounced)
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      // Only save if qrSettings exist (avoid saving initial empty state if irrelevant)
      if (form.qrSettings) {
        updateFormAction(form)
          .then((result) => {
            if (!result.success) {
              console.error('Auto-save failed:', result.error);
              toast.error(`Auto-save failed: ${result.error}`);
            }
          })
          .catch((err) => console.error('Auto-save network error', err));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.qrSettings, form, mounted]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateFormAction(form);
      if (result.success) {
        toast.success('Form saved successfully');
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFormAction(form.id);
      toast.success('Form deleted successfully');
      // Redirect handled by server action usually, or we can redirect here if needed
    } catch {
      toast.error('Failed to delete form');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('form-qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // High resolution: 1000x1000
        const highResSize = 1000;
        canvas.width = highResSize;
        canvas.height = highResSize;
        // Scale up the image
        ctx?.drawImage(img, 0, 0, highResSize, highResSize);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${form.title}-qr-highres.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code dimuat turun! (1000x1000px)');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy method
      }
    }
    // Legacy fallback using textarea
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto py-3 px-3 sm:px-4 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 shrink-0 max-w-[55%]">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{form.title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Editing Form</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`}
              target="_blank"
            >
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </Link>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-2 sm:px-3"
                  suppressHydrationWarning
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Delete Form?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this form? This action cannot be undone and all
                    collected data will be lost.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-3">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={deleting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? 'Deleting...' : 'Delete Form'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 px-3 sm:px-4"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
              <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-3 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Settings & Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>General Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Form Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={form.description || ''}
                    onChange={(value) => setForm((f) => ({ ...f, description: value }))}
                    placeholder="Enter form description..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label>Cover Image URL</Label>
                    <span className="text-xs text-muted-foreground">Rec: 1200x600px (2:1)</span>
                  </div>
                  <Input
                    placeholder="https://example.com/poster.jpg"
                    value={form.coverImage || ''}
                    onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  />
                  {form.coverImage && (
                    <div
                      className="mt-2 aspect-video rounded-md bg-cover bg-center border"
                      style={{ backgroundImage: `url(${getProxiedImageUrl(form.coverImage)})` }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label>Logo URL (Optional)</Label>
                    <span className="text-xs text-muted-foreground">Rec Height: 100-200px</span>
                  </div>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={form.theme?.logo || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        theme: { ...f.theme, logo: e.target.value },
                      }))
                    }
                  />
                  {form.theme?.logo && (
                    <div className="mt-2 h-16 w-auto inline-block border rounded bg-slate-50 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.theme.logo}
                        alt="Logo"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title Alignment</Label>
                    <Select
                      value={form.theme?.headerAlignment || 'left'}
                      onValueChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          theme: {
                            ...f.theme,
                            headerAlignment: val as 'left' | 'center',
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Header Font Style</Label>
                    <Select
                      value={form.theme?.headerFont || 'inter'}
                      onValueChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          theme: {
                            ...f.theme,
                            headerFont: val as 'inter' | 'playfair' | 'lora' | 'roboto',
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Font Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Modern (Inter)</SelectItem>
                        <SelectItem value="playfair">Elegant (Playfair)</SelectItem>
                        <SelectItem value="lora">Formal (Lora)</SelectItem>
                        <SelectItem value="roboto">Official (Roboto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Google Sheet Share URL</Label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={form.googleSheetUrl || ''}
                    onChange={(e) => setForm((f) => ({ ...f, googleSheetUrl: e.target.value }))}
                  />
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      How to link your Google Sheet:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                      <li>Create a new Google Sheet.</li>
                      <li>
                        Click <strong>Share</strong> &gt; Add the Service Account email below as{' '}
                        <strong>Editor</strong>.
                      </li>
                      <li>Copy and paste the Google Sheet URL above.</li>
                    </ol>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-white dark:bg-gray-800"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/service-email');
                            if (res.ok) {
                              const { email } = await res.json();
                              const copied = await copyToClipboard(email);
                              if (copied) {
                                toast.success('Service Account Email copied!');
                              } else {
                                toast.info(`Email: ${email}`, { duration: 10000 });
                              }
                            } else {
                              toast.error('Please configure your settings first.');
                            }
                          } catch {
                            toast.error('Failed to fetch service email.');
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Service Email
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Paste this into Google Sheet Share
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Thank You Message</Label>
                  <Textarea
                    placeholder="Thank you for your submission! We will get back to you soon."
                    value={form.thankYouMessage || ''}
                    onChange={(e) => setForm((f) => ({ ...f, thankYouMessage: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Leave blank to show the default message.
                  </p>
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50">
                  <Switch
                    id="allow-multiple"
                    checked={form.allowMultipleSubmissions ?? true} // Default to true if undefined
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, allowMultipleSubmissions: checked }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="allow-multiple" className="cursor-pointer">
                      Show &quot;Submit another response&quot; button
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this to let users submit the form multiple times easily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings Card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize the look and feel of your public form.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full border shadow-sm ring-1 ring-black/5 [clip-path:circle(50%)]">
                      <input
                        type="color"
                        value={form.theme?.primaryColor || '#000000'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            theme: { ...f.theme, primaryColor: e.target.value },
                          }))
                        }
                        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] p-0 m-0 cursor-pointer border-0"
                        title="Primary color picker"
                      />
                    </div>
                    <Input
                      value={form.theme?.primaryColor || '#000000'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          theme: { ...f.theme, primaryColor: e.target.value },
                        }))
                      }
                      className="font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for buttons, borders, and accents.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full border shadow-sm ring-1 ring-black/5 [clip-path:circle(50%)]">
                      <input
                        type="color"
                        value={form.theme?.backgroundColor || '#ffffff'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            theme: { ...f.theme, backgroundColor: e.target.value },
                          }))
                        }
                        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] p-0 m-0 cursor-pointer border-0"
                        title="Background color picker"
                      />
                    </div>
                    <Input
                      value={form.theme?.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          theme: { ...f.theme, backgroundColor: e.target.value },
                        }))
                      }
                      className="font-mono uppercase"
                      placeholder="#ffffff"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Main page background color.</p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Background Pattern</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[
                      { id: 'none', label: 'None', pattern: 'bg-gray-100' },
                      {
                        id: 'dots',
                        label: 'Dots',
                        pattern:
                          'bg-[radial-gradient(circle,_#00000040_1px,_transparent_1px)] bg-[length:12px_12px]',
                      },
                      {
                        id: 'grid',
                        label: 'Grid',
                        pattern:
                          'bg-[linear-gradient(#00000020_1px,_transparent_1px),linear-gradient(90deg,_#00000020_1px,_transparent_1px)] bg-[length:20px_20px]',
                      },
                      {
                        id: 'diagonal',
                        label: 'Diagonal',
                        pattern:
                          'bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_#00000015_10px,_#00000015_11px)]',
                      },
                      {
                        id: 'waves',
                        label: 'Waves',
                        pattern:
                          'bg-[radial-gradient(circle_at_50%_0,_#00000040_10px,_transparent_10.5px)] bg-[length:20px_20px]',
                      },
                      {
                        id: 'circles',
                        label: 'Circles',
                        pattern:
                          'bg-[radial-gradient(circle_at_center,_#00000040_2px,_transparent_2px)] bg-[length:24px_24px]',
                      },
                      {
                        id: 'triangles',
                        label: 'Triangles',
                        pattern:
                          'bg-[linear-gradient(135deg,_#00000020_25%,_transparent_25%),linear-gradient(225deg,_#00000020_25%,_transparent_25%)] bg-[length:20px_20px]',
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            theme: {
                              ...f.theme,
                              backgroundPattern: p.id as
                                | 'none'
                                | 'dots'
                                | 'grid'
                                | 'diagonal'
                                | 'waves'
                                | 'circles'
                                | 'triangles',
                            },
                          }))
                        }
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          (form.theme?.backgroundPattern || 'none') === p.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-md ${p.pattern} border`} />
                        <span className="text-xs font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add a subtle pattern overlay to the background.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* E-Cert Settings Card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle>E-Cert Settings</CardTitle>
                  </div>
                  <Switch
                    checked={form.eCertificateEnabled || false}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, eCertificateEnabled: checked }))
                    }
                  />
                </div>
                <CardDescription>
                  Enable e-certificate for participants to download with IC verification
                </CardDescription>
              </CardHeader>

              {form.eCertificateEnabled && (
                <CardContent className="space-y-6">
                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Important Info:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>
                            Your form needs a field <strong>&quot;Name&quot;</strong> or{' '}
                            <strong>&quot;Nama&quot;</strong> for the certificate name
                          </li>
                          <li>
                            Your form needs a field <strong>&quot;IC&quot;</strong> or{' '}
                            <strong>&quot;No IC&quot;</strong> for verification
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Template Gallery - User Created Certificates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Select Certificate Template</Label>
                      <Link href="/ecert/builder">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="h-4 w-4" />
                          Create New Certificate
                        </Button>
                      </Link>
                    </div>

                    {userCertificates.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                        <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          No certificate templates. Create your certificate template first.
                        </p>
                        <Link href="/ecert/builder">
                          <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Certificate Now
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {userCertificates.map((cert) => (
                          <div
                            key={cert.id}
                            onClick={() =>
                              setForm((f) => ({ ...f, eCertificateTemplate: cert.id }))
                            }
                            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative group ${
                              form.eCertificateTemplate === cert.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Thumbnail */}
                            <div
                              className="w-full aspect-[297/210] relative overflow-hidden"
                              style={{ backgroundColor: cert.backgroundColor }}
                            >
                              {cert.thumbnail ? (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cert.thumbnail}
                                    alt={cert.name}
                                    className="w-full h-full object-cover"
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <FileImage className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-2 text-center text-sm font-medium bg-gray-50 border-t truncate">
                              {cert.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Check Certificate Link */}
                  {mounted && form.eCertificateEnabled && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Certificate Verification Link:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-white p-2 rounded border text-green-700 break-all">
                          {`${window.location.origin}/ecert/check/${form.id}`}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const url = `${window.location.origin}/ecert/check/${form.id}`;
                            const copied = await copyToClipboard(url);
                            if (copied) toast.success('Link disalin!');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Attendance Settings Card */}
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>Attendance & Location</CardTitle>
                  </div>
                  <Switch
                    checked={form.attendanceSettings?.enabled || false}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        attendanceSettings: { ...(f.attendanceSettings || {}), enabled: checked },
                      }))
                    }
                  />
                </div>
                <CardDescription>
                  Limit form access by time and location (Geofence).
                </CardDescription>
              </CardHeader>
              {form.attendanceSettings?.enabled && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.attendanceSettings?.startTime || ''}
                        onChange={(e) =>
                          setForm(
                            (f) =>
                              ({
                                ...f,
                                attendanceSettings: {
                                  ...(f.attendanceSettings || { list: '' }),
                                  startTime: e.target.value,
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              }) as any
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.attendanceSettings?.endTime || ''}
                        onChange={(e) =>
                          setForm(
                            (f) =>
                              ({
                                ...f,
                                attendanceSettings: {
                                  ...(f.attendanceSettings || {}),
                                  endTime: e.target.value,
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              }) as any
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Geofencing (Location Lock)</Label>
                      <Switch
                        checked={form.attendanceSettings?.geofence?.enabled || false}
                        onCheckedChange={(checked) =>
                          setForm(
                            (f) =>
                              ({
                                ...f,
                                attendanceSettings: {
                                  ...(f.attendanceSettings || {}),
                                  geofence: {
                                    ...(f.attendanceSettings?.geofence || {
                                      lat: 0,
                                      lng: 0,
                                      radius: 100,
                                    }),
                                    enabled: checked,
                                  },
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              }) as any
                          )
                        }
                      />
                    </div>

                    {form.attendanceSettings?.geofence?.enabled && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-4 border">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={form.attendanceSettings.geofence?.lat || 0}
                              onChange={(e) =>
                                setForm(
                                  (f) =>
                                    ({
                                      ...f,
                                      attendanceSettings: {
                                        ...f.attendanceSettings,
                                        geofence: {
                                          ...f.attendanceSettings!.geofence!,
                                          lat: parseFloat(e.target.value),
                                        },
                                      },
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    }) as any
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={form.attendanceSettings.geofence?.lng || 0}
                              onChange={(e) =>
                                setForm(
                                  (f) =>
                                    ({
                                      ...f,
                                      attendanceSettings: {
                                        ...f.attendanceSettings,
                                        geofence: {
                                          ...f.attendanceSettings!.geofence!,
                                          lng: parseFloat(e.target.value),
                                        },
                                      },
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    }) as any
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Radius (meters)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={form.attendanceSettings.geofence?.radius || 100}
                              onChange={(e) =>
                                setForm(
                                  (f) =>
                                    ({
                                      ...f,
                                      attendanceSettings: {
                                        ...f.attendanceSettings,
                                        geofence: {
                                          ...f.attendanceSettings!.geofence!,
                                          radius: parseInt(e.target.value),
                                        },
                                      },
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    }) as any
                                )
                              }
                            />
                            <span className="text-sm text-gray-500">meters</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setForm(
                                    (f) =>
                                      ({
                                        ...f,
                                        attendanceSettings: {
                                          ...f.attendanceSettings,
                                          geofence: {
                                            ...f.attendanceSettings!.geofence!,
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude,
                                          },
                                        },
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      }) as any
                                  );
                                  toast.success('Location updated to your current position');
                                },
                                (error) => {
                                  toast.error('Error getting location: ' + error.message);
                                }
                              );
                            } else {
                              toast.error('Geolocation is not supported by this browser.');
                            }
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Set Current Location
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            <Separator />
            <h2 className="text-xl font-semibold">Form Fields</h2>
            <FieldsEditor
              fields={form.fields}
              onChange={(fields) => setForm((f) => ({ ...f, fields }))}
            />
          </div>

          {/* Right: QR Code & Analysis (Placeholder) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share</CardTitle>
                <CardDescription>Distribute your form</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  {mounted && (
                    <QRCodeSVG
                      id="form-qr-code"
                      value={publicUrl}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground break-all">{publicUrl}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={downloadQR}>
                  <Download className="mr-2 h-4 w-4" />
                  Download High Res QR
                </Button>

                {mounted && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant="secondary"
                        suppressHydrationWarning={true}
                      >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Customize QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Custom QR Generator</DialogTitle>
                        <DialogDescription>
                          Design your QR code specific for this form.
                        </DialogDescription>
                      </DialogHeader>
                      <QrCustomizer
                        url={publicUrl}
                        settings={form.qrSettings}
                        onSettingsChange={(settings) =>
                          setForm((f) => ({ ...f, qrSettings: settings }))
                        }
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
