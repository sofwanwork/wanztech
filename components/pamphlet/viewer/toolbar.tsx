'use client';

import React from 'react';
import {
  BookOpen,
  SlidersHorizontal,
  Scroll,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Copy,
  LayoutGrid,
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  ExternalLink,
  Award,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Pamphlet,
  PamphletDisplayMode,
  PamphletTheme,
} from '@/lib/types/pamphlets';
import { PAMPHLET_THEMES } from '@/lib/pamphlets/themes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ToolbarProps {
  pamphlet: Pamphlet;
  currentPage: number;
  totalPages: number;
  displayMode: PamphletDisplayMode;
  theme: PamphletTheme;
  zoom: number;
  soundEnabled: boolean;
  isFullscreen: boolean;
  showThumbnails: boolean;
  onPageChange: (page: number) => void;
  onDisplayModeChange: (mode: PamphletDisplayMode) => void;
  onThemeChange: (theme: PamphletTheme) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onToggleThumbnails: () => void;
}

export function PamphletToolbar({
  pamphlet,
  currentPage,
  totalPages,
  displayMode,
  theme,
  zoom,
  soundEnabled,
  isFullscreen,
  showThumbnails,
  onPageChange,
  onDisplayModeChange,
  onThemeChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleSound,
  onToggleFullscreen,
  onToggleThumbnails,
}: ToolbarProps) {
  const [copied, setCopied] = React.useState(false);
  const themeObj = PAMPHLET_THEMES[theme] || PAMPHLET_THEMES.dark;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Pautan pamphlet telah disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const text = encodeURIComponent(
      `Sila lihat Buku Program Digital: *${pamphlet.title}*\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Top Floating Control Bar */}
      <header
        className={cn(
          'w-full z-30 transition-all duration-300 py-2.5 px-3 md:px-6 flex items-center justify-between gap-2 border-b select-none',
          themeObj.toolbarBg
        )}
      >
        {/* Title and Event Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold truncate tracking-tight">
              {pamphlet.title || 'Buku Program Digital'}
            </h1>
            {(pamphlet.eventDate || pamphlet.location) && (
              <p className="text-[11px] opacity-70 truncate">
                {[pamphlet.eventDate, pamphlet.location].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons & Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Custom Action Buttons (Check-in / E-Cert / WhatsApp) */}
          {pamphlet.actionButtons && pamphlet.actionButtons.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 mr-1 border-r pr-2 border-current/15">
              {pamphlet.actionButtons.slice(0, 3).map((btn) => {
                const getIcon = () => {
                  if (btn.type === 'checkin') return <QrCode className="h-3.5 w-3.5 mr-1.5" />;
                  if (btn.type === 'cert') return <Award className="h-3.5 w-3.5 mr-1.5" />;
                  if (btn.type === 'whatsapp') return <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />;
                  return <ExternalLink className="h-3.5 w-3.5 mr-1.5" />;
                };

                return (
                  <Button
                    key={btn.id}
                    size="sm"
                    variant={btn.type === 'primary' ? 'default' : 'outline'}
                    className={cn(
                      'h-8 text-xs font-medium rounded-lg',
                      btn.type === 'whatsapp' && 'border-emerald-500/30 hover:bg-emerald-500/10'
                    )}
                    onClick={() => {
                      if (btn.url && btn.url !== '#') {
                        window.open(btn.url, '_blank');
                      } else {
                        toast.info(`Tindakan: ${btn.label}`);
                      }
                    }}
                  >
                    {getIcon()}
                    <span>{btn.label}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Display Mode Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border border-current/15"
                title="Mod Paparan"
              >
                {displayMode === 'flipbook' && <BookOpen className="h-3.5 w-3.5" />}
                {displayMode === 'slide' && <SlidersHorizontal className="h-3.5 w-3.5" />}
                {displayMode === 'vertical' && <Scroll className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline capitalize">
                  {displayMode === 'flipbook' ? 'Flipbook' : displayMode === 'slide' ? 'Slide' : 'Skrol'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => onDisplayModeChange('flipbook')}
                className={cn(
                  'w-full flex items-center px-2.5 py-1.5 text-xs rounded-md text-left transition-colors',
                  displayMode === 'flipbook' ? 'font-semibold bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                )}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span>3D Flipbook</span>
              </button>
              <button
                type="button"
                onClick={() => onDisplayModeChange('slide')}
                className={cn(
                  'w-full flex items-center px-2.5 py-1.5 text-xs rounded-md text-left transition-colors',
                  displayMode === 'slide' ? 'font-semibold bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                )}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <span>Touch Slider</span>
              </button>
              <button
                type="button"
                onClick={() => onDisplayModeChange('vertical')}
                className={cn(
                  'w-full flex items-center px-2.5 py-1.5 text-xs rounded-md text-left transition-colors',
                  displayMode === 'vertical' ? 'font-semibold bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                )}
              >
                <Scroll className="h-4 w-4 mr-2" />
                <span>Skrol Menegak</span>
              </button>
            </PopoverContent>
          </Popover>

          {/* Theme Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="Tukar Suasana Latar"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1.5 space-y-0.5">
              {(Object.keys(PAMPHLET_THEMES) as PamphletTheme[]).map((key) => {
                const t = PAMPHLET_THEMES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onThemeChange(key)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors',
                      theme === key ? 'font-semibold bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                    )}
                  >
                    <span>{t.name}</span>
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-gray-400"
                      style={{ backgroundColor: t.accentColor }}
                    />
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            className="h-8 w-8 rounded-lg"
            title={soundEnabled ? 'Matikan Bunyi Helaian' : 'Hidupkan Bunyi Helaian'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 opacity-60" />
            )}
          </Button>

          {/* Share Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="Kongsi Buku Program"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full flex items-center px-2.5 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2 text-emerald-500" />
                <span>Kongsi ke WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center px-2.5 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                <span>Salin Pautan</span>
              </button>
              {pamphlet.pdfUrl && (
                <button
                  type="button"
                  onClick={() => window.open(pamphlet.pdfUrl, '_blank')}
                  className="w-full flex items-center px-2.5 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>Muat Turun PDF Asal</span>
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="h-8 w-8 rounded-lg"
            title={isFullscreen ? 'Keluar Skrin Penuh' : 'Skrin Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Floating Bottom Navigator Bar */}
      <footer
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 rounded-2xl shadow-xl border px-3 py-1.5 flex items-center gap-2 select-none backdrop-blur-xl',
          themeObj.toolbarBg
        )}
      >
        {/* Prev Page Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-8 w-8 rounded-xl"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page indicator & Thumbnails button */}
        <button
          onClick={onToggleThumbnails}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-current/10 transition-colors flex items-center gap-1.5',
            showThumbnails && 'bg-current/15 text-primary font-bold'
          )}
          title="Buka Pratonton Muka Surat"
        >
          <LayoutGrid className="h-3.5 w-3.5 opacity-70" />
          <span>
            {currentPage} / {totalPages || 1}
          </span>
        </button>

        {/* Next Page Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-8 w-8 rounded-xl"
          title="Halaman Seterusnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Zoom Controls Divider */}
        <div className="h-4 w-[1px] bg-current/20 mx-0.5" />

        {/* Zoom Out */}
        <Button
          variant="ghost"
          size="icon"
          disabled={zoom <= 0.6}
          onClick={onZoomOut}
          className="h-8 w-8 rounded-xl"
          title="Kecilkan (Zoom Out)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        {/* Zoom Reset / Value */}
        <button
          onClick={onZoomReset}
          className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded hover:bg-current/10 transition-colors"
          title="Reset Zum ke 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In */}
        <Button
          variant="ghost"
          size="icon"
          disabled={zoom >= 2.5}
          onClick={onZoomIn}
          className="h-8 w-8 rounded-xl"
          title="Besarkan (Zoom In)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </footer>
    </>
  );
}
