'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { BioPage, BioTheme } from '@/lib/types/bio-links';
import { BIO_THEMES, cleanBioUsername, isValidBioUsername } from '@/lib/bio-links/themes';
import { createBioPageAction, deleteBioPageAction, updateBioPageAction } from '@/actions/bio-links';
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
  MousePointerClick,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';

interface CreateBioDialogProps {
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function CreateBioDialog({
  buttonText = 'Create Bio Page',
  variant = 'default',
  size = 'default',
}: CreateBioDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<BioTheme>('emerald');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = cleanBioUsername(e.target.value);
    setUsername(val);
    if (error) setError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!isValidBioUsername(username)) {
      setError('Username must be 3-30 characters with lowercase letters, numbers, hyphens or underscores.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createBioPageAction({
        username,
        title: title.trim() || username,
        theme,
      });

      if (res.success && res.id) {
        setOpen(false);
        router.push(`/bio-builder/${res.id}`);
      } else {
        setError(res.error || 'Failed to create bio page');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2 shadow-sm font-medium">
          <Plus className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Create Bio Link Page
            </DialogTitle>
            <DialogDescription>
              Choose your unique handle and default style for your link-in-bio page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio-username">Handle / Username</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm">
                  klikform.com/bio/
                </span>
                <Input
                  id="bio-username"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="myname"
                  className="rounded-l-none font-mono text-sm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your public URL will be <span className="font-semibold text-gray-700">/bio/{username || 'yourhandle'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio-title">Display Title</Label>
              <Input
                id="bio-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wan Studio | Creator & Tech"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Theme</Label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(Object.keys(BIO_THEMES) as BioTheme[]).map((tKey) => {
                  const t = BIO_THEMES[tKey];
                  const isSelected = theme === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTheme(tKey)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                        style={{ backgroundColor: t.previewColor }}
                      />
                      <span className="truncate w-full text-center">{t.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {isPending ? 'Creating...' : 'Create & Open Builder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BioPageCardProps {
  page: BioPage;
  appUrl: string;
}

export function BioPageCard({ page, appUrl }: BioPageCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [isActive, setIsActive] = useState(page.isActive);
  const [isDeleting, startDelete] = useTransition();
  const [isUpdating, startUpdate] = useTransition();
  const qrRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  const publicUrl = `${appUrl}/bio/${page.username}`;
  const theme = BIO_THEMES[page.theme] || BIO_THEMES.emerald;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    startUpdate(async () => {
      await updateBioPageAction(page.id, { isActive: checked });
    });
  };

  const handleDelete = () => {
    startDelete(async () => {
      const res = await deleteBioPageAction(page.id);
      if (res.success) {
        router.refresh();
      }
    });
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
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Banner with Theme Preview */}
      <div className={`h-16 ${theme.bg} relative p-4 flex items-center justify-between`}>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20">
          {theme.name}
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-white/90 cursor-pointer flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <span>{isActive ? 'Active' : 'Draft'}</span>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
              className="scale-75 data-[state=checked]:bg-emerald-500"
            />
          </label>
        </div>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {/* Profile Info */}
        <div className="flex items-start gap-3.5 -mt-10">
          <div className="relative">
            {page.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.avatarUrl}
                alt={page.title}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                className="w-14 h-14 rounded-full object-cover ring-4 ring-white shadow-md bg-gray-100"
              />
            ) : null}
            <div
              className={`w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center ring-4 ring-white shadow-md ${
                page.avatarUrl ? 'hidden' : ''
              }`}
            >
              {(page.title || page.username).charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 pt-6 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base leading-tight">
              {page.title || page.username}
            </h3>
            <p className="text-xs font-mono text-emerald-600 truncate mt-0.5">
              @{page.username}
            </p>
          </div>
        </div>

        {page.bio && (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {page.bio}
          </p>
        )}

        {/* Public URL Box */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
          <span className="truncate flex-1 font-mono text-gray-700 select-all pl-1">
            {publicUrl}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-gray-500 hover:text-gray-900 shrink-0"
            title="Copy Public Link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 shrink-0 transition-colors"
            title="Open Live Bio"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
            <Eye className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">Views:</span>
            <span className="font-semibold text-gray-900 ml-auto">{page.views}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
            <MousePointerClick className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">Theme:</span>
            <span className="font-semibold text-gray-900 ml-auto truncate capitalize">{page.theme}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQrOpen(true)}
          className="gap-1.5 text-xs text-gray-700 hover:text-gray-900 shadow-none border-gray-200"
        >
          <QrCode className="h-3.5 w-3.5" />
          QR Code
        </Button>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Delete Bio Page"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "@{page.username}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this bio link page and all of its links. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Page
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link href={`/bio-builder/${page.id}`}>
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm font-medium">
              <Edit className="h-3.5 w-3.5" />
              Open Builder
            </Button>
          </Link>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">QR Code for @{page.username}</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Scan to view your bio link page instantly on any phone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm my-2">
            <QRCodeSVG
              ref={qrRef}
              value={publicUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
            <p className="font-mono text-xs text-gray-500 mt-2 truncate max-w-full">
              {publicUrl}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="w-full gap-1.5 text-xs shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied Link!' : 'Copy Link'}
            </Button>
            <Button
              size="sm"
              onClick={downloadQR}
              className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
