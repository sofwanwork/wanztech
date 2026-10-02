'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Pamphlet, PamphletTheme, PamphletDisplayMode } from '@/lib/types/pamphlets';
import { cleanPamphletSlug, isValidPamphletSlug } from '@/lib/pamphlets/utils';
import {
  createPamphletAction,
  deletePamphletAction,
  updatePamphletAction,
} from '@/actions/pamphlets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreatePamphletDialogProps {
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function CreatePamphletDialog({
  buttonText = 'Cipta E-Pamphlet',
  variant = 'default',
  size = 'default',
}: CreatePamphletDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const theme: PamphletTheme = 'emerald';
  const [displayMode, setDisplayMode] = useState<PamphletDisplayMode>('flipbook');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug || slug === cleanPamphletSlug(title)) {
      setSlug(cleanPamphletSlug(val));
    }
    if (error) setError(null);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(cleanPamphletSlug(e.target.value));
    if (error) setError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Sila masukkan tajuk buku program / acara.');
      return;
    }
    if (!slug.trim()) {
      setError('Sila masukkan pautan (slug) ringkas.');
      return;
    }
    if (!isValidPamphletSlug(slug)) {
      setError('Slug mestilah 3-60 aksara menggunakan huruf kecil, nombor dan tanda sengkang (-).');
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createPamphletAction({
        title: title.trim(),
        slug,
        theme,
        displayMode,
      });

      if (res.success && res.id) {
        setOpen(false);
        toast.success('Buku program berjaya dicipta!');
        router.push(`/pamphlet-builder/${res.id}`);
      } else {
        setError(res.error || 'Gagal mencipta pamphlet');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2 shadow-sm font-semibold">
          <Plus className="w-4 h-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Cipta E-Pamphlet Baharu
            </DialogTitle>
            <DialogDescription>
              Mulakan buku program digital majlis anda. Anda boleh muat naik helaian muka surat selepas ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pamphlet-title" className="text-xs font-semibold">
                Tajuk Majlis / Buku Program <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pamphlet-title"
                placeholder="Contoh: Kejohanan Sukan Tahunan 2026"
                value={title}
                onChange={handleTitleChange}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pamphlet-slug" className="text-xs font-semibold">
                Pautan URL Ringkas <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
                <span className="shrink-0 text-xs font-mono opacity-60">klikform.com/p/</span>
                <input
                  id="pamphlet-slug"
                  className="w-full bg-transparent pl-1 font-mono text-sm text-foreground focus:outline-none"
                  placeholder="kejohanan-sukan-2026"
                  value={slug}
                  onChange={handleSlugChange}
                  disabled={isPending}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hadirin majlis boleh membuka buku program menggunakan pautan ini atau mengimbas Kod QR.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Mod Paparan Lalai</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMode('flipbook')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    displayMode === 'flipbook'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>3D Flipbook</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('slide')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    displayMode === 'slide'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Touch Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('vertical')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    displayMode === 'vertical'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Skrol Menegak</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="font-semibold">
              {isPending ? 'Mencipta...' : 'Seterusnya →'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PamphletCard({
  pamphlet,
  appUrl,
}: {
  pamphlet: Pamphlet;
  appUrl: string;
}) {
  const [isActive, setIsActive] = useState(pamphlet.isActive);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const qrRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const publicUrl = `${appUrl}/p/${pamphlet.slug}`;
  const pageCount = Array.isArray(pamphlet.pages) ? pamphlet.pages.length : 0;

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    startTransition(async () => {
      const res = await updatePamphletAction(pamphlet.id, { isActive: checked });
      if (res.success) {
        toast.success(checked ? 'Pamphlet diaktifkan' : 'Pamphlet dinyahaktifkan');
      } else {
        setIsActive(!checked);
        toast.error('Gagal mengemas kini status');
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Pautan pamphlet telah disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deletePamphletAction(pamphlet.id);
      if (res.success) {
        toast.success('Pamphlet telah dipadam');
        router.refresh();
      } else {
        toast.error('Gagal memadam pamphlet');
      }
    });
  };

  const handleDownloadQrPng = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1000, 1000);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-Buku-Program-${pamphlet.slug}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="group relative rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* Top Banner / Cover Preview */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {pamphlet.coverImage || (pamphlet.pages && pamphlet.pages[0]?.imageUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pamphlet.coverImage || pamphlet.pages[0].imageUrl}
            alt={pamphlet.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
            <BookOpen className="w-8 h-8 opacity-40 text-white" />
            <span className="text-xs font-medium text-slate-300">Belum ada muka surat</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Status Badge & Toggle */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 z-10 border border-white/10">
          <span className="text-[11px] font-medium text-white">
            {isActive ? 'Aktif' : 'Tutup'}
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggleActive}
            disabled={isPending}
            className="scale-75 data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Display Mode Pill */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2 py-0.5 z-10 text-[10px] font-semibold text-white/90 border border-white/15 capitalize flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-primary" />
          {pamphlet.displayMode === 'flipbook' ? '3D Flipbook' : pamphlet.displayMode}
        </div>

        {/* Bottom Title on Image */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 drop-shadow-sm">
            {pamphlet.title}
          </h3>
          <p className="text-[11px] text-white/80 line-clamp-1">
            {[pamphlet.eventDate, pamphlet.location].filter(Boolean).join(' • ') || 'klikform.com/p/' + pamphlet.slug}
          </p>
        </div>
      </div>

      {/* Details & Stats */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2 border border-gray-100">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{pageCount} Halaman</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2 border border-gray-100">
            <Eye className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">{pamphlet.views || 0} Tontonan</span>
          </div>
        </div>

        {/* Public Link Bar */}
        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
          <span className="text-xs font-mono text-slate-600 truncate">
            /p/{pamphlet.slug}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-900"
              onClick={handleCopy}
              title="Salin Pautan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-900"
              title="Buka Viewer Awam"
            >
              <Link href={`/p/${pamphlet.slug}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full text-xs font-semibold gap-1 rounded-xl"
          >
            <Link href={`/pamphlet-builder/${pamphlet.id}`}>
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrOpen(true)}
            className="w-full text-xs font-medium gap-1 rounded-xl"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Kod QR</span>
          </Button>

          {/* Delete Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                disabled={isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Padam E-Pamphlet ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak boleh diundur. Halaman & pautan <strong>/p/{pamphlet.slug}</strong> akan ditutup serta-merta.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Ya, Padam
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* QR Code Modal for Printing */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">
              Kod QR E-Pamphlet Majlis
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Cetak kod QR ini pada bunting, banner dewan, atau atur cara meja supaya hadirin boleh mengimbas terus buku program digital ini.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center gap-3">
            <div
              ref={qrRef}
              className="p-5 bg-white rounded-2xl border-2 border-primary/20 shadow-lg"
            >
              <QRCodeSVG
                value={publicUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{pamphlet.title}</p>
              <p className="text-xs font-mono text-muted-foreground">{publicUrl}</p>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:justify-stretch">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="w-full gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>Salin URL</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadQrPng}
              className="w-full gap-1.5 font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun PNG</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
