'use client';

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pamphlet,
  PamphletPageItem,
  PamphletTheme,
  PamphletActionButton,
  PamphletOrientation,
} from '@/lib/types/pamphlets';
import { PAMPHLET_THEMES } from '@/lib/pamphlets/themes';
import {
  cleanPamphletSlug,
  isValidPamphletSlug,
  getSamplePamphlet,
  getSampleLandscapePamphlet,
} from '@/lib/pamphlets/utils';
import { updatePamphletAction } from '@/actions/pamphlets';
import { PamphletViewer } from '@/components/pamphlet/viewer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Save,
  ExternalLink,
  BookOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Sparkles,
  Layers,
  Smartphone,
  Monitor,
  Calendar,
  MapPin,
  FileText,
  Palette,
  Link as LinkIcon,
  MessageCircle,
  QrCode,
  Award,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';

interface PamphletBuilderClientProps {
  initialPamphlet: Pamphlet;
}

export function PamphletBuilderClient({
  initialPamphlet,
}: PamphletBuilderClientProps) {
  const [pamphlet, setPamphlet] = useState<Pamphlet>(initialPamphlet);
  const [isSaving, startSaveTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'pages' | 'details' | 'appearance'>('pages');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Save changes to database
  const handleSave = () => {
    if (!pamphlet.title.trim()) {
      toast.error('Sila masukkan tajuk buku program.');
      return;
    }
    if (!isValidPamphletSlug(pamphlet.slug)) {
      toast.error('Slug tidak sah. Sila gunakan 3-60 aksara alfanumerik dan tanda sengkang (-).');
      return;
    }

    startSaveTransition(async () => {
      const res = await updatePamphletAction(pamphlet.id, {
        title: pamphlet.title,
        slug: pamphlet.slug,
        description: pamphlet.description,
        eventDate: pamphlet.eventDate,
        location: pamphlet.location,
        coverImage: pamphlet.coverImage,
        pdfUrl: pamphlet.pdfUrl,
        theme: pamphlet.theme,
        displayMode: pamphlet.displayMode,
        pages: pamphlet.pages,
        actionButtons: pamphlet.actionButtons,
      });

      if (res.success) {
        toast.success('Perubahan berjaya disimpan!');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menyimpan perubahan.');
      }
    });
  };

  // Upload multiple images
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Memuat naik ${files.length} gambar muka surat...`);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newPages: PamphletPageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let imageUrl = '';

        if (user) {
          const fileExt = file.name.split('.').pop() || 'png';
          const filePath = `${user.id}/pamphlet_${pamphlet.id}_${uuidv4()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('certificate_backgrounds')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);
            imageUrl = publicUrl;
          }
        }

        // Fallback to Data URL if storage bucket fails or not configured
        if (!imageUrl) {
          imageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        // Auto-detect image aspect ratio and orientation
        let pageOrientation: PamphletOrientation = pamphlet.orientation || 'portrait';
        let pageRatio = 1.414;
        try {
          const img = new Image();
          img.src = imageUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          if (img.naturalWidth && img.naturalHeight) {
            pageRatio = +(img.naturalWidth / img.naturalHeight).toFixed(3);
            if (pageRatio > 1.05) {
              pageOrientation = 'landscape';
            }
          }
        } catch {
          // fallback gracefully
        }

        const existingCount = (pamphlet.pages || []).length + newPages.length;
        newPages.push({
          id: uuidv4(),
          pageNumber: existingCount + 1,
          title: `Halaman ${existingCount + 1}`,
          imageUrl,
          aspectRatio: pageRatio,
          orientation: pageOrientation,
        });
      }

      setPamphlet((prev) => {
        const updatedPages = [...(prev.pages || []), ...newPages];
        // Set cover image automatically if not set yet
        const coverImage = prev.coverImage || updatedPages[0]?.imageUrl || '';
        const orientation = prev.orientation || newPages[0]?.orientation || 'portrait';
        return { ...prev, pages: updatedPages, coverImage, orientation };
      });

      toast.success(`${files.length} muka surat berjaya dimuat naik!`, { id: toastId });
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Gagal memuat naik gambar. Sila cuba lagi.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reorder page up
  const movePageUp = (index: number) => {
    if (index <= 0) return;
    setPamphlet((prev) => {
      const copy = [...prev.pages];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      // Re-index page numbers
      const reindexed = copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { ...prev, pages: reindexed };
    });
  };

  // Reorder page down
  const movePageDown = (index: number) => {
    if (index >= pamphlet.pages.length - 1) return;
    setPamphlet((prev) => {
      const copy = [...prev.pages];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      // Re-index page numbers
      const reindexed = copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { ...prev, pages: reindexed };
    });
  };

  // Delete page
  const deletePage = (id: string) => {
    setPamphlet((prev) => {
      const filtered = prev.pages.filter((p) => p.id !== id);
      const reindexed = filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      return { ...prev, pages: reindexed };
    });
    toast.info('Muka surat telah dipadam.');
  };

  // Update page title / bookmark
  const updatePageTitle = (id: string, title: string) => {
    setPamphlet((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === id ? { ...p, title } : p)),
    }));
  };

  // Load sample demo pages (Portrait)
  const handleLoadDemoPages = () => {
    const demo = getSamplePamphlet();
    setPamphlet((prev) => ({
      ...prev,
      orientation: 'portrait',
      pages: demo.pages,
      coverImage: demo.coverImage,
      actionButtons: demo.actionButtons,
    }));
    toast.success('Muka surat contoh Potret berjaya dimuatkan ke editor!');
  };

  // Load sample demo pages (Landscape)
  const handleLoadLandscapeDemoPages = () => {
    const demo = getSampleLandscapePamphlet();
    setPamphlet((prev) => ({
      ...prev,
      orientation: 'landscape',
      pages: demo.pages,
      coverImage: demo.coverImage,
      actionButtons: demo.actionButtons,
    }));
    toast.success('Muka surat contoh Landskap berjaya dimuatkan ke editor!');
  };

  // Switch booklet orientation between portrait and landscape
  const handleOrientationChange = (newOrientation: PamphletOrientation) => {
    setPamphlet((prev) => ({
      ...prev,
      orientation: newOrientation,
      pages: (prev.pages || []).map((p) => ({
        ...p,
        orientation: newOrientation,
      })),
    }));
    toast.info(
      `Orientasi ditukar ke ${newOrientation === 'landscape' ? 'Landskap (Melintang)' : 'Potret (Menegak)'}`
    );
  };

  // Add Action Button
  const handleAddActionButton = (type: 'checkin' | 'cert' | 'whatsapp' | 'primary') => {
    const defaultLabels = {
      checkin: 'Daftar Kehadiran (Check-In)',
      cert: 'Tebus E-Sijil',
      whatsapp: 'WhatsApp Urusetia',
      primary: 'Maklumat Lanjut',
    };

    const newBtn: PamphletActionButton = {
      id: uuidv4(),
      label: defaultLabels[type] || 'Butang Baharu',
      url: type === 'whatsapp' ? 'https://wa.me/60123456789' : '#',
      type,
    };

    setPamphlet((prev) => ({
      ...prev,
      actionButtons: [...(prev.actionButtons || []), newBtn],
    }));
  };

  // Remove Action Button
  const handleRemoveActionButton = (id: string) => {
    setPamphlet((prev) => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).filter((b) => b.id !== id),
    }));
  };

  // Update Action Button
  const handleUpdateActionButton = (id: string, updates: Partial<PamphletActionButton>) => {
    setPamphlet((prev) => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-slate-50">
      {/* Top Action Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <Link href="/pamphlets">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-base font-bold text-gray-900 truncate">
                {pamphlet.title || 'Buku Program Tanpa Tajuk'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground truncate font-mono">
              /p/{pamphlet.slug}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Preview Device Toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDevice('desktop')}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                previewDevice === 'desktop' ? 'bg-white shadow-xs font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDevice('mobile')}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                previewDevice === 'mobile' ? 'bg-white shadow-xs font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </Button>
          </div>

          <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium rounded-xl">
            <Link href={`/p/${pamphlet.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Buka Awam</span>
            </Link>
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </Button>
        </div>
      </header>

      {/* Main Builder Body (Split Left: Controls, Right: Live Interactive Preview) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Configuration Panel */}
        <div className="w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'pages' | 'details' | 'appearance')}
            className="w-full flex-1 flex flex-col"
          >
            <div className="px-4 pt-3 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <TabsList className="grid grid-cols-3 w-full rounded-xl bg-gray-200/70 p-1">
                <TabsTrigger value="pages" className="text-xs font-semibold rounded-lg gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Halaman ({pamphlet.pages?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs font-semibold rounded-lg gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Maklumat</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="text-xs font-semibold rounded-lg gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  <span>Gaya & Butang</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: PAGES MANAGER */}
            <TabsContent value="pages" className="p-4 space-y-4 flex-1 m-0">
              {/* Upload Actions Banner */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Muat Naik Muka Surat Pamphlet</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pilih imej (PNG, JPG, WebP). Anda boleh muat naik berbilang imej serentak.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFilesUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="sm"
                    className="gap-2 font-semibold"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Pilih Fail Imej</span>
                  </Button>

                  {(!pamphlet.pages || pamphlet.pages.length === 0) && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoadDemoPages}
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Contoh Potret</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoadLandscapeDemoPages}
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Monitor className="w-3.5 h-3.5 text-blue-500" />
                        <span>Contoh Landskap</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Orientation Selector Card */}
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span>Orientasi Buku Program</span>
                  </Label>
                  <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                    {pamphlet.orientation === 'landscape' ? '💻 Landskap (Melintang)' : '📱 Potret (Menegak)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOrientationChange('portrait')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all',
                      pamphlet.orientation !== 'landscape'
                        ? 'border-primary bg-primary text-white shadow-xs font-bold'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Potret (Menegak)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrientationChange('landscape')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all',
                      pamphlet.orientation === 'landscape'
                        ? 'border-primary bg-primary text-white shadow-xs font-bold'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Landskap (Melintang)</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Sistem melaraskan geometri paparan 3D Flipbook & slaid secara pintar mengikut orientasi buku program anda.
                </p>
              </div>

              {/* Pages List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Susunan Halaman
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {pamphlet.pages?.length || 0} muka surat
                  </span>
                </div>

                {(!pamphlet.pages || pamphlet.pages.length === 0) ? (
                  <div className="p-8 text-center border rounded-2xl bg-gray-50/50 text-muted-foreground text-xs">
                    Belum ada muka surat. Sila muat naik imej atau tekan &ldquo;Muat Contoh&rdquo; di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pamphlet.pages.map((page, idx) => (
                      <div
                        key={page.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary/50 transition-all shadow-2xs group"
                      >
                        {/* Page Number & Thumbnail */}
                        <div
                          className={cn(
                            'relative rounded-lg overflow-hidden border border-gray-200 bg-slate-900 shrink-0 transition-all',
                            pamphlet.orientation === 'landscape'
                              ? 'w-16 aspect-[1.414/1]'
                              : 'w-12 aspect-[1/1.414]'
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={page.imageUrl}
                            alt={page.title || `Halaman ${page.pageNumber}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center py-0.5">
                            {idx + 1}
                          </div>
                        </div>

                        {/* Title input */}
                        <div className="flex-1 min-w-0">
                          <Input
                            value={page.title || ''}
                            onChange={(e) => updatePageTitle(page.id, e.target.value)}
                            placeholder={`Halaman ${idx + 1}`}
                            className="h-8 text-xs font-medium"
                          />
                        </div>

                        {/* Move Up / Down / Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => movePageUp(idx)}
                            className="h-7 w-7 rounded-lg text-gray-500 hover:text-gray-900"
                            title="Gerak ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === pamphlet.pages.length - 1}
                            onClick={() => movePageDown(idx)}
                            className="h-7 w-7 rounded-lg text-gray-500 hover:text-gray-900"
                            title="Gerak ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePage(page.id)}
                            className="h-7 w-7 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Padam Muka Surat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: EVENT DETAILS */}
            <TabsContent value="details" className="p-4 space-y-4 flex-1 m-0">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold">
                  Tajuk Buku Program / Acara <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={pamphlet.title}
                  onChange={(e) => setPamphlet({ ...pamphlet, title: e.target.value })}
                  placeholder="Contoh: Majlis Apresiasi Kecemerlangan 2026"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-slug" className="text-xs font-semibold">
                  Pautan URL Ringkas <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  <span className="shrink-0 text-xs font-mono opacity-60">klikform.com/p/</span>
                  <input
                    id="edit-slug"
                    className="w-full bg-transparent pl-1 font-mono text-sm text-foreground focus:outline-none"
                    value={pamphlet.slug}
                    onChange={(e) =>
                      setPamphlet({ ...pamphlet, slug: cleanPamphletSlug(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-desc" className="text-xs font-semibold">
                  Penerangan Ringkas
                </Label>
                <Textarea
                  id="edit-desc"
                  rows={3}
                  value={pamphlet.description || ''}
                  onChange={(e) => setPamphlet({ ...pamphlet, description: e.target.value })}
                  placeholder="Buku program rasmi sempena Majlis Apresiasi..."
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date" className="text-xs font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tarikh Acara</span>
                  </Label>
                  <Input
                    id="edit-date"
                    value={pamphlet.eventDate || ''}
                    onChange={(e) => setPamphlet({ ...pamphlet, eventDate: e.target.value })}
                    placeholder="24 Oktober 2026"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-loc" className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tempat / Lokasi</span>
                  </Label>
                  <Input
                    id="edit-loc"
                    value={pamphlet.location || ''}
                    onChange={(e) => setPamphlet({ ...pamphlet, location: e.target.value })}
                    placeholder="Dewan Gemilang"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="edit-pdf" className="text-xs font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Pautan Fail PDF Asal (Opsyenal)</span>
                </Label>
                <Input
                  id="edit-pdf"
                  value={pamphlet.pdfUrl || ''}
                  onChange={(e) => setPamphlet({ ...pamphlet, pdfUrl: e.target.value })}
                  placeholder="https://drive.google.com/... atau pautan PDF terus"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Jika diisi, butang &ldquo;Muat Turun PDF Asal&rdquo; akan dipaparkan dalam menu perkongsian viewer.
                </p>
              </div>
            </TabsContent>

            {/* TAB 3: APPEARANCE & ACTIONS */}
            <TabsContent value="appearance" className="p-4 space-y-5 flex-1 m-0">
              {/* Display Mode Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mod Paparan Lalai (Viewer Mode)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPamphlet({ ...pamphlet, displayMode: 'flipbook' })}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      pamphlet.displayMode === 'flipbook'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>3D Flipbook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPamphlet({ ...pamphlet, displayMode: 'slide' })}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      pamphlet.displayMode === 'slide'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                    <span>Touch Slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPamphlet({ ...pamphlet, displayMode: 'vertical' })}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      pamphlet.displayMode === 'vertical'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Skrol Menegak</span>
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Suasana Rona Latar (Backdrop Theme)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PAMPHLET_THEMES) as PamphletTheme[]).map((themeKey) => {
                    const t = PAMPHLET_THEMES[themeKey];
                    const isSelected = pamphlet.theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setPamphlet({ ...pamphlet, theme: themeKey })}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 shadow-xs'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-gray-400 shrink-0 mt-0.5"
                          style={{ backgroundColor: t.accentColor }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons in Viewer */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Butang Tindakan Majlis
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Pautan pantas di bar atas viewer (cth: Check-In, E-Sijil, WhatsApp).
                    </p>
                  </div>
                </div>

                {/* Add Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddActionButton('checkin')}
                    className="text-xs gap-1.5 h-7 rounded-lg"
                  >
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    <span>+ Check-In Borang</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddActionButton('cert')}
                    className="text-xs gap-1.5 h-7 rounded-lg"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>+ Tebus E-Sijil</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddActionButton('whatsapp')}
                    className="text-xs gap-1.5 h-7 rounded-lg"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+ WhatsApp</span>
                  </Button>
                </div>

                {/* List of current action buttons */}
                {pamphlet.actionButtons && pamphlet.actionButtons.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {pamphlet.actionButtons.map((btn) => (
                      <div
                        key={btn.id}
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-gray-700 capitalize flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-primary" />
                            {btn.type || 'Pautan'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveActionButton(btn.id)}
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={btn.label}
                            onChange={(e) =>
                              handleUpdateActionButton(btn.id, { label: e.target.value })
                            }
                            placeholder="Label butang"
                            className="h-8 text-xs bg-white"
                          />
                          <Input
                            value={btn.url}
                            onChange={(e) =>
                              handleUpdateActionButton(btn.id, { url: e.target.value })
                            }
                            placeholder="https://..."
                            className="h-8 text-xs font-mono bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Live Interactive Pamphlet Preview */}
        <div className="hidden lg:flex flex-1 bg-slate-950 items-center justify-center p-6 overflow-hidden relative">
          <div
            className={`transition-all duration-300 relative shadow-2xl overflow-hidden rounded-2xl border border-white/10 ${
              previewDevice === 'mobile'
                ? 'w-[400px] h-[780px] max-h-[92vh] rounded-[40px] border-8 border-slate-800 shadow-2xl ring-1 ring-white/20'
                : 'w-full h-full'
            }`}
          >
            <PamphletViewer pamphlet={pamphlet} previewMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
