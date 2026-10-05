'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Pamphlet, PamphletTheme, PamphletDisplayMode } from '@/lib/types/pamphlets';
import { cleanPamphletSlug, isValidPamphletSlug } from '@/lib/pamphlets/utils';
import { DEFAULT_PAMPHLET_THEME } from '@/lib/pamphlets/themes';
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
  buttonText = 'Create E-Pamphlet',
  variant = 'default',
  size = 'default',
}: CreatePamphletDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const theme: PamphletTheme = DEFAULT_PAMPHLET_THEME;
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
      setError('Please enter event / program book title.');
      return;
    }
    if (!slug.trim()) {
      setError('Please enter short link (slug).');
      return;
    }
    if (!isValidPamphletSlug(slug)) {
      setError('Slug must be 3-60 characters using lowercase letters, numbers, and hyphens (-).');
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
        toast.success('Program book created successfully!');
        router.push(`/pamphlet-builder/${res.id}`);
      } else {
        setError(res.error || 'Failed to create pamphlet');
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
              Create New E-Pamphlet
            </DialogTitle>
            <DialogDescription>
              Start your digital event program book. You can upload pages right after.
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
                Event / Program Book Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pamphlet-title"
                placeholder="Example: Annual Sports Day 2026"
                value={title}
                onChange={handleTitleChange}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pamphlet-slug" className="text-xs font-semibold">
                Short URL Link <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
                <span className="shrink-0 text-xs font-mono opacity-60">klikform.com/p/</span>
                <input
                  id="pamphlet-slug"
                  className="w-full bg-transparent pl-1 font-mono text-sm text-foreground focus:outline-none"
                  placeholder="annual-sports-day-2026"
                  value={slug}
                  onChange={handleSlugChange}
                  disabled={isPending}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Attendees can open the program book using this link or by scanning the QR Code.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Default Display Mode</Label>
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
                  <span>Touch Slider</span>
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
                  <span>Vertical Scroll</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="font-semibold">
              {isPending ? 'Creating...' : 'Next →'}
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
        toast.success(checked ? 'Pamphlet activated' : 'Pamphlet deactivated');
      } else {
        setIsActive(!checked);
        toast.error('Failed to update status');
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Pamphlet link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deletePamphletAction(pamphlet.id);
      if (res.success) {
        toast.success('Pamphlet deleted');
        router.refresh();
      } else {
        toast.error('Failed to delete pamphlet');
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
        downloadLink.download = `QR-Program-Book-${pamphlet.slug}.png`;
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
            <span className="text-xs font-medium text-slate-300">No pages yet</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Status Badge & Toggle */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 z-10 border border-white/10">
          <span className="text-[11px] font-medium text-white">
            {isActive ? 'Active' : 'Closed'}
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
            <span className="truncate">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2 border border-gray-100">
            <Eye className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">{pamphlet.views || 0} {pamphlet.views === 1 ? 'View' : 'Views'}</span>
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
              title="Copy Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-900"
              title="Open Public Viewer"
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
            <span>QR Code</span>
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
                <span>Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this E-Pamphlet?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The page & link <strong>/p/{pamphlet.slug}</strong> will be closed immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Delete
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
              Event E-Pamphlet QR Code
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Print this QR code on buntings, hall banners, or table tent cards so attendees can scan and access this digital program book.
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
              <span>Copy URL</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadQrPng}
              className="w-full gap-1.5 font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Notice banner displayed when the pamphlets table has not been created yet in Supabase
 */
export function PamphletDatabaseNotice({ sqlScript }: { sqlScript: string }) {
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      toast.success('Migration SQL script copied successfully! Please paste it in the Supabase SQL Editor.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy script.');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-bold text-amber-950">
              E-Pamphlet Database Not Activated
            </h3>
          </div>
          <p className="text-xs md:text-sm text-amber-800 leading-relaxed max-w-3xl">
            The <code className="px-1.5 py-0.5 rounded bg-amber-200/70 font-mono text-xs text-amber-900">public.pamphlets</code> table does not exist in Supabase yet. Please copy the migration SQL script below and run it in <strong>Supabase Dashboard &gt; SQL Editor</strong> to enable saving and publishing e-pamphlets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSql(!showSql)}
            className="border-amber-300 bg-amber-100/60 hover:bg-amber-100 text-amber-900 text-xs"
          >
            {showSql ? 'Hide SQL' : 'View SQL Script'}
          </Button>
          <Button
            size="sm"
            onClick={handleCopySql}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
          </Button>
        </div>
      </div>

      {showSql && (
        <div className="mt-4 pt-4 border-t border-amber-200/80">
          <div className="relative">
            <pre className="max-h-56 overflow-auto p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed">
              <code>{sqlScript}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
