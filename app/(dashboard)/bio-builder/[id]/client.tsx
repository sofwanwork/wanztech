'use client';

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  BioPageWithLinks,
  BioLink,
  BioTheme,
  BioButtonStyle,
  BioSocialLinks,
  BioLinkType,
  BioPattern,
} from '@/lib/types/bio-links';
import {
  BIO_THEMES,
  BUTTON_STYLES,
  BIO_PATTERNS,
  cleanBioUsername,
  isValidBioUsername,
  getBioButtonClass,
  getBioPatternStyle,
} from '@/lib/bio-links/themes';
import {
  updateBioPageAction,
  createBioLinkAction,
  updateBioLinkAction,
  deleteBioLinkAction,
  reorderBioLinksAction,
} from '@/actions/bio-links';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  Plus,
  GripVertical,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Trash2,
  Edit2,
  Sparkles,
  Link as LinkIcon,
  MessageCircle,
  FileText,
  Heading,
  Download,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Send,
  Github,
  Mail,
  Globe,
  Linkedin,
  Smartphone,
  CheckCircle2,
  Upload,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/image-compression';
import { v4 as uuidv4 } from 'uuid';

interface FormSummaryItem {
  id: string;
  title: string;
  shortCode?: string;
}

interface BioBuilderClientProps {
  initialPage: BioPageWithLinks;
  forms: FormSummaryItem[];
  appUrl: string;
}

export function BioBuilderClient({ initialPage, forms, appUrl }: BioBuilderClientProps) {
  const [page, setPage] = useState<BioPageWithLinks>(initialPage);
  const [links, setLinks] = useState<BioLink[]>(initialPage.links);
  const [activeTab, setActiveTab] = useState('links');
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [copied, setCopied] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [, startTransition] = useTransition();
  const qrRef = useRef<SVGSVGElement>(null);

  const publicUrl = `${appUrl}/bio/${page.username}`;
  const theme = BIO_THEMES[page.theme] || BIO_THEMES.emerald;

  // DnD Sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const updated = arrayMove(items, oldIndex, newIndex);

        // Sync reorder with server
        startTransition(async () => {
          setSavedStatus('saving');
          await reorderBioLinksAction(
            page.id,
            updated.map((l) => l.id)
          );
          setSavedStatus('saved');
        });

        return updated;
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePage = async (updates: Partial<BioPageWithLinks>) => {
    setPage((prev) => ({ ...prev, ...updates }));
    setSavedStatus('saving');

    startTransition(async () => {
      const res = await updateBioPageAction(page.id, updates);
      if (res.success && res.page) {
        setSavedStatus('saved');
      } else {
        setSavedStatus('idle');
      }
    });
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const supabase = createClient();

  const deleteOldAvatar = async (url: string) => {
    try {
      const bucketName = 'qr_logos';
      const parts = url.split(`/${bucketName}/`);
      if (parts.length === 2) {
        const path = parts[1];
        await supabase.storage.from(bucketName).remove([path]);
      }
    } catch (e) {
      console.warn('Failed to cleanup old avatar:', e);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const oldAvatarUrl = page.avatarUrl;

      if (!file.type.startsWith('image/')) {
        toast.error('Sila muat naik fail gambar (PNG, JPG, WEBP).');
        return;
      }

      try {
        setIsUploadingAvatar(true);

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAvatarPreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);

        const compressedFile = await compressImage(file, 1);
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `bio-avatar-${uuidv4()}.${fileExt}`;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const dir = user ? user.id : 'public';
        const filePath = `${dir}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('qr_logos')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('qr_logos').getPublicUrl(filePath);

        setPage((p) => ({ ...p, avatarUrl: publicUrl }));
        setAvatarPreview(publicUrl);
        handleSavePage({ avatarUrl: publicUrl });

        toast.success('Gambar profil berjaya dimuat naik!');

        if (oldAvatarUrl && oldAvatarUrl.includes('/qr_logos/')) {
          await deleteOldAvatar(oldAvatarUrl);
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Gagal memuat naik gambar profil.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    const oldAvatarUrl = page.avatarUrl;
    setPage((p) => ({ ...p, avatarUrl: '' }));
    setAvatarPreview(null);
    handleSavePage({ avatarUrl: '' });

    if (oldAvatarUrl && oldAvatarUrl.includes('/qr_logos/')) {
      await deleteOldAvatar(oldAvatarUrl);
    }
    toast.success('Gambar profil dibuang.');
  };

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 600, 600);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `klikbio-${page.username}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bio">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-900 text-lg md:text-xl truncate max-w-[200px] md:max-w-md">
                {page.title || page.username}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                @{page.username}
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              {savedStatus === 'saving' ? (
                <span className="text-amber-600 animate-pulse">Saving changes...</span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Saved to cloud
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Preview Toggle Button (visible on < lg screens) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobilePreviewOpen(true)}
            className="lg:hidden gap-1.5 text-xs text-gray-700"
          >
            <Smartphone className="h-4 w-4 text-emerald-600" />
            Preview
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 text-xs hidden sm:flex"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm font-medium">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Public</span> Bio
            </Button>
          </a>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Settings Tabs */}
          <div className="lg:col-span-7 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="links" className="rounded-lg text-xs md:text-sm font-medium gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="theme" className="rounded-lg text-xs md:text-sm font-medium gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-lg text-xs md:text-sm font-medium gap-1.5">
                  <Instagram className="h-3.5 w-3.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="share" className="rounded-lg text-xs md:text-sm font-medium gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  Share & QR
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: LINKS & BLOCKS */}
              <TabsContent value="links" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Your Bio Links</h3>
                    <p className="text-xs text-gray-500">Drag to reorder your links and buttons.</p>
                  </div>
                  <AddLinkDialog
                    bioPageId={page.id}
                    forms={forms}
                    onLinkAdded={(newLink) => setLinks((prev) => [...prev, newLink])}
                  />
                </div>

                {links.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-white space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900 text-sm">No links added yet</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Add your first link, WhatsApp chat button, or KlikForm form to showcase on your bio page.
                      </p>
                    </div>
                    <AddLinkDialog
                      bioPageId={page.id}
                      forms={forms}
                      onLinkAdded={(newLink) => setLinks((prev) => [...prev, newLink])}
                      buttonText="Add Your First Link"
                    />
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={links.map((l) => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {links.map((link) => (
                          <SortableBioLinkItem
                            key={link.id}
                            link={link}
                            forms={forms}
                            onUpdate={(updated) =>
                              setLinks((prev) =>
                                prev.map((l) => (l.id === updated.id ? updated : l))
                              )
                            }
                            onDelete={(deletedId) =>
                              setLinks((prev) => prev.filter((l) => l.id !== deletedId))
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>

              {/* TAB 2: DESIGN & THEME */}
              <TabsContent value="theme" className="space-y-6 pt-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Color Themes</h3>
                    <p className="text-xs text-gray-500">Pick from 8 pre-crafted aesthetic color palettes.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.keys(BIO_THEMES) as BioTheme[]).map((tKey) => {
                      const t = BIO_THEMES[tKey];
                      const isSelected = page.theme === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => handleSavePage({ theme: tKey })}
                          className={`relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/40 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div
                            className={`h-12 w-full rounded-lg ${t.bg} flex items-center justify-center p-2 mb-2 shadow-inner`}
                          >
                            <div className="w-full h-3 rounded-full bg-white/30 backdrop-blur-sm" />
                          </div>
                          <span className="font-semibold text-xs text-gray-900">{t.name}</span>
                          <span className="text-[10px] text-gray-500 truncate">{t.description}</span>
                          {isSelected && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Button Corner Styles</h3>
                    <p className="text-xs text-gray-500">Choose the shape and appearance of link buttons.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(BUTTON_STYLES) as BioButtonStyle[]).map((bKey) => {
                      const b = BUTTON_STYLES[bKey];
                      const currentStyle = page.themeConfig?.buttonStyle || 'rounded-full';
                      const isSelected = currentStyle === bKey;
                      return (
                        <button
                          key={bKey}
                          type="button"
                          onClick={() =>
                            handleSavePage({
                              themeConfig: { ...page.themeConfig, buttonStyle: bKey },
                            })
                          }
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/40 text-emerald-950 font-semibold shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          <div
                            className={`py-2 px-3 border border-gray-300 bg-gray-50 text-xs mb-1.5 font-medium ${b.class}`}
                          >
                            Sample Button
                          </div>
                          <span className="text-xs">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Background Patterns / Corak Latar</h3>
                    <p className="text-xs text-gray-500">Add subtle decorative textures over your page background.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.keys(BIO_PATTERNS) as BioPattern[]).map((pKey) => {
                      const p = BIO_PATTERNS[pKey];
                      const currentPattern = page.themeConfig?.pattern || 'none';
                      const isSelected = currentPattern === pKey;
                      const activeTheme = BIO_THEMES[page.theme] || BIO_THEMES.emerald;

                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() =>
                            handleSavePage({
                              themeConfig: { ...page.themeConfig, pattern: pKey },
                            })
                          }
                          className={`relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/40 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div
                            className={`h-14 w-full rounded-lg ${activeTheme.bg} relative overflow-hidden mb-2 shadow-inner flex items-center justify-center`}
                          >
                            {pKey !== 'none' ? (
                              <div
                                className="absolute inset-0"
                                style={getBioPatternStyle(pKey, page.theme)}
                              />
                            ) : (
                              <span className="text-[11px] font-medium text-white/50 relative z-10">
                                None
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-xs text-gray-900">{p.name}</span>
                          <span className="text-[10px] text-gray-500 truncate">{p.description}</span>
                          {isSelected && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: PROFILE & SOCIALS */}
              <TabsContent value="profile" className="space-y-6 pt-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900">Profile Details</h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-username">Handle / Slug</Label>
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                          klikform.com/bio/
                        </span>
                        <Input
                          id="edit-username"
                          value={page.username}
                          onChange={(e) =>
                            setPage((p) => ({ ...p, username: cleanBioUsername(e.target.value) }))
                          }
                          onBlur={() => {
                            if (isValidBioUsername(page.username)) {
                              handleSavePage({ username: page.username });
                            }
                          }}
                          className="rounded-l-none font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-title">Display Name</Label>
                      <Input
                        id="edit-title"
                        value={page.title}
                        onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))}
                        onBlur={() => handleSavePage({ title: page.title })}
                        placeholder="e.g. Wan Studio | Creator"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-bio">Bio / Description</Label>
                      <Textarea
                        id="edit-bio"
                        rows={2}
                        value={page.bio}
                        onChange={(e) => setPage((p) => ({ ...p, bio: e.target.value }))}
                        onBlur={() => handleSavePage({ bio: page.bio })}
                        placeholder="Tell your visitors a little about yourself or your business..."
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Profile Picture / Avatar</Label>
                      <div className="flex items-center gap-3.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                        {/* Current avatar preview */}
                        <div className="relative shrink-0">
                          {avatarPreview || page.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarPreview || page.avatarUrl}
                              alt="Avatar preview"
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm bg-white"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-lg flex items-center justify-center border-2 border-gray-200 shadow-sm">
                              {(page.title || page.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="avatar-upload"
                              onChange={handleAvatarUpload}
                              disabled={isUploadingAvatar}
                            />
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={isUploadingAvatar}
                              className="gap-1.5 cursor-pointer bg-white text-xs h-8"
                            >
                              <Label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-1.5">
                                {isUploadingAvatar ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                                {isUploadingAvatar
                                  ? 'Uploading...'
                                  : page.avatarUrl
                                  ? 'Change Photo'
                                  : 'Upload Photo'}
                              </Label>
                            </Button>

                            {(page.avatarUrl || avatarPreview) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveAvatar}
                                disabled={isUploadingAvatar}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8 px-2"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>PNG, JPG, WEBP (Auto-optimized)</span>
                            <button
                              type="button"
                              onClick={() => setShowUrlInput(!showUrlInput)}
                              className="text-emerald-600 hover:underline hover:text-emerald-700 font-medium ml-2"
                            >
                              {showUrlInput ? 'Hide URL' : 'Paste URL instead'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {showUrlInput && (
                        <div className="space-y-1 pt-1">
                          <Input
                            id="edit-avatar"
                            value={page.avatarUrl}
                            onChange={(e) => {
                              setPage((p) => ({ ...p, avatarUrl: e.target.value }));
                              setAvatarPreview(e.target.value);
                            }}
                            onBlur={() => handleSavePage({ avatarUrl: page.avatarUrl })}
                            placeholder="https://example.com/avatar.jpg"
                            className="text-xs h-8"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Make sure it is a direct public image link (.png, .jpg, .webp).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Social Media Handles</h3>
                    <p className="text-xs text-gray-500">
                      Icons will automatically appear at the top of your bio page.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '60123456789' },
                      { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username' },
                      { key: 'tiktok', label: 'TikTok', icon: Send, placeholder: 'username' },
                      { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'username / page' },
                      { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: 'username' },
                      { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: '@channel' },
                      { key: 'telegram', label: 'Telegram', icon: Send, placeholder: 'username' },
                      { key: 'email', label: 'Email', icon: Mail, placeholder: 'hello@example.com' },
                      { key: 'website', label: 'Website', icon: Globe, placeholder: 'example.com' },
                      { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'in/username' },
                      { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
                    ].map(({ key, label, icon: Icon, placeholder }) => {
                      const k = key as keyof BioSocialLinks;
                      const val = page.socialLinks?.[k] || '';
                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs flex items-center gap-1.5 text-gray-700">
                            <Icon className="h-3.5 w-3.5 text-gray-500" />
                            {label}
                          </Label>
                          <Input
                            value={val}
                            onChange={(e) => {
                              const updatedSocials = {
                                ...page.socialLinks,
                                [k]: e.target.value,
                              };
                              setPage((p) => ({ ...p, socialLinks: updatedSocials }));
                            }}
                            onBlur={() => handleSavePage({ socialLinks: page.socialLinks })}
                            placeholder={placeholder}
                            className="text-xs h-8"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: SHARE & QR */}
              <TabsContent value="share" className="space-y-6 pt-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Share Your Bio Link</h3>
                    <p className="text-xs text-gray-500">
                      Promote your personalized bio page across social channels and print materials.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm shrink-0">
                      <QRCodeSVG
                        ref={qrRef}
                        value={publicUrl}
                        size={160}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="space-y-3 flex-1 text-center sm:text-left">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Dynamic QR Code</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Download this high-resolution QR code for name cards, posters, and flyers.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Button
                          size="sm"
                          onClick={downloadQR}
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download PNG
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="gap-1.5 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? 'Copied URL' : 'Copy URL'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Share Shortcuts */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Quick Share</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Jom layari profil saya: ${publicUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        WhatsApp
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(`Profil saya: ${page.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-xs font-medium hover:bg-sky-100 transition-colors"
                      >
                        <Send className="h-4 w-4 text-sky-600" />
                        Telegram
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my bio link: ${publicUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-xs font-medium hover:bg-gray-100 transition-colors"
                      >
                        <Twitter className="h-4 w-4 text-gray-700" />
                        X / Twitter
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Live Mobile Mockup Preview (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 sticky top-24 justify-center">
            <MobileMockupView
              page={page}
              links={links}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* Mobile Preview Modal (for smaller screens) */}
      <Dialog open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <DialogContent className="max-w-sm p-2 bg-transparent border-none shadow-none flex justify-center">
          <MobileMockupView
            page={page}
            links={links}
            theme={theme}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SORTABLE LINK ITEM COMPONENT
// ---------------------------------------------------------------------------

interface SortableBioLinkItemProps {
  link: BioLink;
  forms: FormSummaryItem[];
  onUpdate: (updated: BioLink) => void;
  onDelete: (id: string) => void;
}

function SortableBioLinkItem({
  link,
  forms,
  onUpdate,
  onDelete,
}: SortableBioLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [type, setType] = useState<BioLinkType>(link.type);
  const [highlight, setHighlight] = useState(link.highlight);
  const [isActive, setIsActive] = useState(link.isActive);
  const [isUpdating, startUpdate] = useTransition();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    startUpdate(async () => {
      const res = await updateBioLinkAction(link.id, link.bioPageId, { isActive: checked });
      if (res.success && res.link) onUpdate(res.link);
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    startUpdate(async () => {
      const res = await updateBioLinkAction(link.id, link.bioPageId, {
        title,
        url,
        type,
        highlight,
      });
      if (res.success && res.link) {
        onUpdate(res.link);
        setEditOpen(false);
      }
    });
  };

  const handleDelete = () => {
    startUpdate(async () => {
      const res = await deleteBioLinkAction(link.id, link.bioPageId);
      if (res.success) {
        onDelete(link.id);
      }
    });
  };

  const getIconForType = () => {
    switch (link.type) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-emerald-600" />;
      case 'form':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'header':
        return <Heading className="h-4 w-4 text-gray-600" />;
      default:
        return <LinkIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${
        isDragging ? 'border-emerald-500 shadow-lg' : 'border-gray-200 shadow-sm'
      } p-3.5 flex items-center gap-3 transition-colors`}
    >
      {/* Drag Grip Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing p-1 touch-none"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Type Icon */}
      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
        {getIconForType()}
      </div>

      {/* Link Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{link.title}</h4>
          {link.highlight && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Glow
            </span>
          )}
        </div>
        {link.type !== 'header' && (
          <p className="text-xs text-gray-500 font-mono truncate mt-0.5">{link.url || 'No URL configured'}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggleActive}
          disabled={isUpdating}
          className="scale-75 data-[state=checked]:bg-emerald-600"
          title="Toggle visibility"
        />

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-900"
              title="Edit Link"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveEdit} className="min-w-0 max-w-full">
              <DialogHeader>
                <DialogTitle>Edit Link Block</DialogTitle>
                <DialogDescription>Update link title, destination URL, or styling.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 min-w-0">
                <div className="space-y-2">
                  <Label>Block Type</Label>
                  <Select value={type} onValueChange={(val) => setType(val as BioLinkType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Custom URL Link</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Direct Chat</SelectItem>
                      <SelectItem value="form">KlikForm Form</SelectItem>
                      <SelectItem value="header">Section Header Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === 'form' && forms.length > 0 && (
                  <div className="space-y-2">
                    <Label>Choose KlikForm Form</Label>
                    <Select
                      value={forms.find((f) => url.includes(f.shortCode || f.id))?.id || ''}
                      onValueChange={(formId) => {
                        const chosenForm = forms.find((f) => f.id === formId);
                        if (chosenForm) {
                          setUrl(`/form/${chosenForm.shortCode || chosenForm.id}`);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a form" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-w-[var(--radix-select-trigger-width)]">
                        {forms.map((f) => (
                          <SelectItem key={f.id} value={f.id} title={f.title}>
                            <span className="truncate">{f.title}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Title / Text</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {type !== 'header' && (
                  <div className="space-y-2">
                    <Label>
                      {type === 'whatsapp' ? 'Phone Number / wa.me' : 'Destination URL'}
                    </Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={type === 'whatsapp' ? '60123456789' : 'https://...'}
                      required
                    />
                  </div>
                )}

                {type !== 'header' && (
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Highlight Animation (Pulse)</p>
                      <p className="text-[11px] text-gray-500">Draw visitor attention to this priority button.</p>
                    </div>
                    <Switch
                      checked={highlight}
                      onCheckedChange={setHighlight}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Delete Link"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this link?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{link.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADD LINK DIALOG COMPONENT
// ---------------------------------------------------------------------------

interface AddLinkDialogProps {
  bioPageId: string;
  forms: FormSummaryItem[];
  onLinkAdded: (link: BioLink) => void;
  buttonText?: string;
}

function AddLinkDialog({
  bioPageId,
  forms,
  onLinkAdded,
  buttonText = 'Add Block / Link',
}: AddLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<BioLinkType>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [highlight, setHighlight] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    const chosenForm = forms.find((f) => f.id === formId);
    if (chosenForm) {
      if (!title) setTitle(chosenForm.title);
      setUrl(`/form/${chosenForm.shortCode || chosenForm.id}`);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    let finalUrl = url.trim();
    if (type === 'whatsapp') {
      const cleanPhone = waPhone.replace(/[^0-9]/g, '');
      finalUrl = `https://wa.me/${cleanPhone}${
        waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''
      }`;
    }

    startTransition(async () => {
      const res = await createBioLinkAction(bioPageId, {
        type,
        title: title.trim(),
        url: finalUrl,
        highlight,
      });

      if (res.success && res.link) {
        onLinkAdded(res.link);
        // Reset form
        setTitle('');
        setUrl('');
        setWaPhone('');
        setWaMessage('');
        setSelectedFormId('');
        setHighlight(false);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm font-medium">
          <Plus className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleAdd} className="min-w-0 max-w-full">
          <DialogHeader>
            <DialogTitle>Add New Link / Block</DialogTitle>
            <DialogDescription>
              Choose a block type to add to your bio link page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 min-w-0">
            <div className="space-y-2">
              <Label>Block Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'link', label: 'Custom Link', icon: LinkIcon, desc: 'URL or external site' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Direct WhatsApp chat' },
                  { id: 'form', label: 'KlikForm Form', icon: FileText, desc: 'Link to your form' },
                  { id: 'header', label: 'Section Header', icon: Heading, desc: 'Text divider heading' },
                ].map(({ id, label, icon: Icon, desc }) => {
                  const isSelected = type === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setType(id as BioLinkType)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all min-w-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-900 mb-0.5 min-w-0">
                        <Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 truncate">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {type === 'form' && forms.length > 0 && (
              <div className="space-y-2">
                <Label>Choose KlikForm Form</Label>
                <Select value={selectedFormId} onValueChange={handleFormSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a form from your account" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-w-[var(--radix-select-trigger-width)]">
                    {forms.map((f) => (
                      <SelectItem key={f.id} value={f.id} title={f.title}>
                        <span className="truncate">{f.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {type === 'header' ? 'Header Text' : 'Button Title'}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'header'
                    ? 'e.g. Featured Products'
                    : type === 'whatsapp'
                    ? 'Chat on WhatsApp'
                    : 'e.g. Visit My Portfolio'
                }
                required
              />
            </div>

            {type === 'link' && (
              <div className="space-y-2">
                <Label>Destination URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            {type === 'whatsapp' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Phone Number (with Country Code)</Label>
                  <Input
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="60123456789"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pre-filled Message (Optional)</Label>
                  <Input
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Hi! I would like to inquire about..."
                  />
                </div>
              </div>
            )}

            {type !== 'header' && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-900">Highlight Animation</p>
                  <p className="text-[11px] text-gray-500">Makes the button subtly glow and stand out.</p>
                </div>
                <Switch
                  checked={highlight}
                  onCheckedChange={setHighlight}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {isPending ? 'Adding...' : 'Add to Bio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// LIVE MOBILE MOCKUP VIEW COMPONENT
// ---------------------------------------------------------------------------

interface MobileMockupViewProps {
  page: BioPageWithLinks;
  links: BioLink[];
  theme: typeof BIO_THEMES['emerald'];
}

function MobileMockupView({
  page,
  links,
  theme,
}: MobileMockupViewProps) {
  const activeLinks = links.filter((l) => l.isActive);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [page.avatarUrl]);

  return (
    <div className="w-[320px] sm:w-[350px] h-[660px] rounded-[48px] border-[10px] border-gray-900 bg-gray-900 shadow-2xl p-2.5 relative flex flex-col justify-between overflow-hidden">
      {/* Top Phone Speaker & Camera Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-gray-900 rounded-b-2xl z-20 flex items-center justify-center">
        <div className="w-10 h-1 bg-gray-800 rounded-full" />
      </div>

      {/* Screen Area */}
      <div
        className={`w-full h-full rounded-[38px] ${theme.bg} overflow-y-auto px-4 py-8 flex flex-col justify-between items-center text-center relative custom-scrollbar`}
      >
        {/* Background Pattern */}
        {page.themeConfig?.pattern && page.themeConfig.pattern !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[38px] min-h-full z-0"
            style={getBioPatternStyle(page.themeConfig.pattern, theme)}
          />
        )}

        <div className="w-full space-y-4 pt-4 relative z-10">
          {/* Avatar Profile */}
          <div className="relative inline-block">
            {page.avatarUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.avatarUrl}
                alt={page.title || page.username}
                onError={() => setImgError(true)}
                className={`w-20 h-20 rounded-full object-cover shadow-lg mx-auto ${theme.avatarBorder}`}
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-2xl flex items-center justify-center shadow-lg mx-auto ${theme.avatarBorder}`}
              >
                {(page.title || page.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Title & Bio */}
          <div className="space-y-1">
            <h2 className={`font-bold text-base leading-tight ${theme.textColor}`}>
              {page.title || page.username}
            </h2>
            {page.bio && (
              <p className={`text-xs max-w-[240px] mx-auto leading-relaxed ${theme.bioColor}`}>
                {page.bio}
              </p>
            )}
          </div>

          {/* Social Icons Row */}
          {page.socialLinks && Object.values(page.socialLinks).some(Boolean) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {Object.entries(page.socialLinks).map(([platform, val]) => {
                if (!val) return null;
                const p = platform as keyof BioSocialLinks;
                return (
                  <span
                    key={platform}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/15 shadow-sm text-xs"
                    title={platform}
                  >
                    {getSocialIcon(p)}
                  </span>
                );
              })}
            </div>
          )}

          {/* Links List */}
          <div className="space-y-2.5 pt-2 w-full">
            {activeLinks.length === 0 ? (
              <div className="py-8 text-xs text-white/60">
                No active links to display.
              </div>
            ) : (
              activeLinks.map((l) => {
                if (l.type === 'header') {
                  return (
                    <div key={l.id} className="pt-2 pb-1 text-center">
                      <span className={`text-xs font-bold tracking-wider uppercase ${theme.textColor} opacity-90`}>
                        {l.title}
                      </span>
                    </div>
                  );
                }

                const isHighlight = l.highlight;
                return (
                  <div
                    key={l.id}
                    className={`w-full py-3 px-4 font-medium text-xs flex items-center justify-between transition-all select-none ${getBioButtonClass(
                      theme,
                      page.themeConfig?.buttonStyle || 'rounded-full',
                      isHighlight
                    )} ${isHighlight ? 'animate-pulse' : ''}`}
                  >
                    <span className="truncate flex-1 text-center font-medium">{l.title}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Brand */}
        <div className="pt-6 pb-2 relative z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/20 text-white/75 backdrop-blur-md text-[10px]">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Powered by <strong>KlikForm</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSocialIcon(platform: keyof BioSocialLinks) {
  switch (platform) {
    case 'whatsapp':
      return <MessageCircle className="h-4 w-4" />;
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'tiktok':
      return <Send className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4" />;
    case 'twitter':
      return <Twitter className="h-4 w-4" />;
    case 'youtube':
      return <Youtube className="h-4 w-4" />;
    case 'telegram':
      return <Send className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'website':
      return <Globe className="h-4 w-4" />;
    case 'github':
      return <Github className="h-4 w-4" />;
    case 'linkedin':
      return <Linkedin className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}
