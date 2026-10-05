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
  FileText,
  Play,
  Pause,
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
import { PAMPHLET_THEMES, DEFAULT_PAMPHLET_THEME } from '@/lib/pamphlets/themes';
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
  pageSpreadMode?: 'auto' | 'single' | 'double';
  isTwoPageSpread?: boolean;
  forceMobile?: boolean;
  onPageChange: (pageNumber: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onDisplayModeChange: (mode: PamphletDisplayMode) => void;
  onThemeChange: (theme: PamphletTheme) => void;
  onToggleSpreadMode?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onToggleThumbnails: () => void;
  isAutoSliding?: boolean;
  onToggleAutoSlide?: () => void;
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
  isTwoPageSpread,
  forceMobile = false,
  onPageChange,
  onNextPage,
  onPrevPage,
  onDisplayModeChange,
  onThemeChange,
  onToggleSpreadMode,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleSound,
  onToggleFullscreen,
  onToggleThumbnails,
  isAutoSliding = false,
  onToggleAutoSlide,
}: ToolbarProps) {
  const [copied, setCopied] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const isMobileLayout = forceMobile || !isDesktop;
  const themeObj = PAMPHLET_THEMES[theme] || PAMPHLET_THEMES[DEFAULT_PAMPHLET_THEME];

  React.useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Pamphlet link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const text = encodeURIComponent(
      `Please view Digital Program Book: *${pamphlet.title}*\n${url}`
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
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm md:text-base font-bold truncate tracking-tight">
              {pamphlet.title || 'Digital Program Book'}
            </h1>
            {(pamphlet.eventDate || pamphlet.location) && (
              <p className="text-[10px] sm:text-[11px] opacity-70 truncate">
                {[pamphlet.eventDate, pamphlet.location].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons & Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Custom Action Buttons (Check-in / E-Cert / WhatsApp) */}
          {pamphlet.actionButtons && pamphlet.actionButtons.length > 0 && (
            <>
              {/* Desktop Action Pills */}
              {!isMobileLayout && (
                <div className="hidden lg:flex items-center gap-2 mr-1 border-r pr-2 border-current/15">
                  {pamphlet.actionButtons.slice(0, 3).map((btn) => {
                    const isWhatsapp = btn.type === 'whatsapp';
                    const isCheckin = btn.type === 'checkin';
                    const isCert = btn.type === 'cert';

                    return (
                      <Button
                        key={btn.id}
                        size="sm"
                        className={cn(
                          'h-8 text-xs font-semibold rounded-lg shadow-sm transition-all',
                          isWhatsapp
                            ? 'bg-[#25D366] hover:bg-[#20ba59] text-white border-transparent'
                            : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
                        )}
                        onClick={() => {
                          if (btn.url && btn.url !== '#') {
                            window.open(btn.url, '_blank');
                          } else {
                            toast.info(`Action: ${btn.label}`);
                          }
                        }}
                      >
                        {isCheckin && <QrCode className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />}
                        {isCert && <Award className="h-3.5 w-3.5 mr-1.5 text-amber-600 shrink-0" />}
                        {isWhatsapp && (
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-white fill-white/20 shrink-0" />
                        )}
                        {!isCheckin && !isCert && !isWhatsapp && (
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-sky-600 shrink-0" />
                        )}
                        <span className={cn(isWhatsapp ? 'text-white' : 'text-slate-900')}>
                          {btn.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Mobile / Tablet Compact Action Dropdown */}
              {isMobileLayout && (
                <div className="flex mr-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs font-semibold bg-white text-slate-900 border-slate-300 hover:bg-slate-100 shadow-sm gap-1 rounded-lg"
                        title="Event Actions"
                      >
                        <QrCode className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-900 font-semibold text-[11px]">Actions</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-56 p-2 space-y-1 bg-white text-slate-900 shadow-xl border border-slate-200 rounded-xl z-50"
                    >
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
                        Event Actions
                      </p>
                      {pamphlet.actionButtons.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => {
                            if (btn.url && btn.url !== '#') {
                              window.open(btn.url, '_blank');
                            } else {
                              toast.info(`Action: ${btn.label}`);
                            }
                          }}
                          className="w-full flex items-center px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 text-left transition-colors text-slate-900"
                        >
                          {btn.type === 'checkin' && (
                            <QrCode className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                          )}
                          {btn.type === 'cert' && (
                            <Award className="h-4 w-4 mr-2 text-amber-600 shrink-0" />
                          )}
                          {btn.type === 'whatsapp' && (
                            <MessageCircle className="h-4 w-4 mr-2 text-[#25D366] shrink-0" />
                          )}
                          {btn.type !== 'checkin' && btn.type !== 'cert' && btn.type !== 'whatsapp' && (
                            <ExternalLink className="h-4 w-4 mr-2 text-sky-600 shrink-0" />
                          )}
                          <span className="truncate text-slate-900">{btn.label}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}

          {/* Display Mode Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size={isMobileLayout ? 'icon' : 'sm'}
                className={cn(
                  'h-8 rounded-lg border border-current/15',
                  isMobileLayout ? 'w-8 p-0' : 'px-2.5 text-xs gap-1.5'
                )}
                title="Display Mode"
              >
                {displayMode === 'flipbook' && <BookOpen className="h-3.5 w-3.5" />}
                {displayMode === 'slide' && <SlidersHorizontal className="h-3.5 w-3.5" />}
                {displayMode === 'vertical' && <Scroll className="h-3.5 w-3.5" />}
                {!isMobileLayout && (
                  <span className="hidden sm:inline capitalize">
                    {displayMode === 'flipbook' ? 'Flipbook' : displayMode === 'slide' ? 'Slide' : 'Scroll'}
                  </span>
                )}
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
                <span>Vertical Scroll</span>
              </button>
            </PopoverContent>
          </Popover>

          {/* Theme Popover (Desktop only to prevent mobile clutter) */}
          {!isMobileLayout && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  title="Change Background Theme"
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
          )}

          {/* Sound Toggle (Desktop only to prevent mobile clutter) */}
          {!isMobileLayout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSound}
              className="h-8 w-8 rounded-lg"
              title={soundEnabled ? 'Mute Page Sound' : 'Unmute Page Sound'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 opacity-60" />
              )}
            </Button>
          )}

          {/* Share Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="Share Program Book"
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
                <span>Share to WhatsApp</span>
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
                <span>Copy Link</span>
              </button>
              {pamphlet.pdfUrl && (
                <button
                  type="button"
                  onClick={() => window.open(pamphlet.pdfUrl, '_blank')}
                  className="w-full flex items-center px-2.5 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>Download Original PDF</span>
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
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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
          'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 rounded-full shadow-2xl border select-none backdrop-blur-xl flex items-center',
          isMobileLayout ? 'px-2 py-1 gap-1' : 'px-3 py-1.5 gap-2',
          themeObj.toolbarBg
        )}
      >
        {/* Prev Page Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage <= 1}
          onClick={onPrevPage || (() => onPageChange(Math.max(1, currentPage - 1)))}
          className="h-8 w-8 rounded-full"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page indicator & Thumbnails button */}
        <button
          onClick={onToggleThumbnails}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-full hover:bg-current/10 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0',
            showThumbnails && 'bg-current/15 text-primary font-bold'
          )}
          title="Open Page Thumbnails"
        >
          <LayoutGrid className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span className="font-mono whitespace-nowrap text-xs">
            {!isMobileLayout && (isTwoPageSpread ?? isDesktop) && displayMode === 'flipbook' && currentPage > 1 && currentPage < totalPages
              ? `${currentPage % 2 === 0 ? currentPage : currentPage - 1}-${Math.min(totalPages, (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1)} / ${totalPages}`
              : `${currentPage} / ${totalPages || 1}`}
          </span>
        </button>

        {/* Next Page Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={onNextPage || (() => onPageChange(Math.min(totalPages, currentPage + 1)))}
          className="h-8 w-8 rounded-full"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Auto Slider Toggle (Slide Mode) */}
        {displayMode === 'slide' && onToggleAutoSlide && totalPages > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAutoSlide}
            className={cn(
              'h-8 px-2.5 text-xs gap-1.5 rounded-full hover:bg-current/10 shrink-0 font-medium transition-all',
              isAutoSliding && 'bg-primary/20 text-primary font-bold shadow-xs'
            )}
            title={isAutoSliding ? 'Pause Auto Slider' : 'Start Auto Slider'}
          >
            {isAutoSliding ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current shrink-0" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span className="hidden sm:inline">Auto</span>
              </>
            )}
          </Button>
        )}

        {/* Spread Mode Toggle (Desktop only) */}
        {!isMobileLayout && displayMode === 'flipbook' && onToggleSpreadMode && totalPages >= 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSpreadMode}
            className="h-8 px-2 text-xs gap-1.5 rounded-xl hover:bg-current/10 shrink-0 font-medium"
            title={
              isTwoPageSpread
                ? 'Currently displayed in 2 Pages (Click to switch to 1 Page)'
                : 'Currently displayed in 1 Page (Click to switch to 2 Pages)'
            }
          >
            {isTwoPageSpread ? (
              <>
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">2 Pages</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">1 Page</span>
              </>
            )}
          </Button>
        )}

        {/* Zoom Controls (Desktop only) */}
        {!isMobileLayout && (
          <>
            <div className="h-4 w-[1px] bg-current/20 mx-0.5" />

            {/* Zoom Out */}
            <Button
              variant="ghost"
              size="icon"
              disabled={zoom <= 0.6}
              onClick={onZoomOut}
              className="h-8 w-8 rounded-xl"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            {/* Zoom Reset / Value */}
            <button
              onClick={onZoomReset}
              className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded hover:bg-current/10 transition-colors"
              title="Reset Zoom to 100%"
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
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </>
        )}
      </footer>
    </>
  );
}
