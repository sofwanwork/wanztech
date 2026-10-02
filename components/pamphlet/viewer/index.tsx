'use client';

import React from 'react';
import {
  Pamphlet,
  PamphletDisplayMode,
  PamphletTheme,
} from '@/lib/types/pamphlets';
import { PAMPHLET_THEMES } from '@/lib/pamphlets/themes';
import { playPageTurnSound, getPamphletOrientation } from '@/lib/pamphlets/utils';
import { PamphletToolbar } from './toolbar';
import { ThumbnailsStrip } from './thumbnails-strip';
import { FlipbookView, FlipbookViewRef } from './flipbook-view';
import { SliderView } from './slider-view';
import { VerticalView } from './vertical-view';
import { trackPamphletViewAction } from '@/actions/pamphlets';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface PamphletViewerProps {
  pamphlet: Pamphlet;
  previewMode?: boolean;
  forceMobile?: boolean;
}

export function PamphletViewer({
  pamphlet,
  previewMode = false,
  forceMobile = false,
}: PamphletViewerProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [displayMode, setDisplayMode] = React.useState<PamphletDisplayMode>(
    pamphlet.displayMode || 'flipbook'
  );
  const [theme, setTheme] = React.useState<PamphletTheme>(
    pamphlet.theme || 'dark'
  );
  const [pageSpreadMode, setPageSpreadMode] = React.useState<'auto' | 'single' | 'double'>('auto');
  const [zoom, setZoom] = React.useState(1);
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showThumbnails, setShowThumbnails] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const flipbookRef = React.useRef<FlipbookViewRef>(null);

  const handleToggleSpreadMode = React.useCallback(() => {
    setPageSpreadMode((prev) => (prev === 'single' ? 'double' : 'single'));
  }, []);

  const pages = React.useMemo(() => {
    return Array.isArray(pamphlet.pages) ? pamphlet.pages : [];
  }, [pamphlet.pages]);

  const orientation = React.useMemo(() => {
    return getPamphletOrientation(pamphlet);
  }, [pamphlet]);

  const totalPages = pages.length;

  // Track view once on mount if not in builder/preview mode
  React.useEffect(() => {
    if (!previewMode && pamphlet.id) {
      trackPamphletViewAction(pamphlet.id);
    }
  }, [pamphlet.id, previewMode]);

  // Handle page change with optional sound
  const handlePageChange = React.useCallback(
    (nextPage: number) => {
      if (nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return;
      setCurrentPage(nextPage);
      if (soundEnabled) {
        playPageTurnSound();
      }
    },
    [currentPage, totalPages, soundEnabled]
  );

  // Spread-aware page change handlers for Desktop 3D Flipbook mode
  const handleNextPage = React.useCallback(() => {
    if (currentPage >= totalPages) return;
    if (displayMode === 'flipbook' && flipbookRef.current) {
      flipbookRef.current.flipNext();
      return;
    }
    handlePageChange(Math.min(totalPages, currentPage + 1));
  }, [currentPage, totalPages, displayMode, handlePageChange]);

  const handlePrevPage = React.useCallback(() => {
    if (currentPage <= 1) return;
    if (displayMode === 'flipbook' && flipbookRef.current) {
      flipbookRef.current.flipPrev();
      return;
    }
    handlePageChange(Math.max(1, currentPage - 1));
  }, [currentPage, displayMode, handlePageChange]);

  // Zoom handlers
  const handleZoomIn = React.useCallback(() => {
    setZoom((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  }, []);

  const handleZoomOut = React.useCallback(() => {
    setZoom((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  }, []);

  const handleZoomReset = React.useCallback(() => {
    setZoom(1);
  }, []);

  // Fullscreen handlers
  const handleToggleFullscreen = React.useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  }, []);

  React.useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard navigation shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'Escape' && showThumbnails) {
        setShowThumbnails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextPage,
    handlePrevPage,
    handleToggleFullscreen,
    showThumbnails,
  ]);

  const themeObj = PAMPHLET_THEMES[theme] || PAMPHLET_THEMES.dark;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-screen overflow-hidden flex flex-col transition-colors duration-500 font-sans',
        themeObj.bgClass
      )}
    >
      {/* Top and Bottom Controls */}
      <PamphletToolbar
        pamphlet={pamphlet}
        currentPage={currentPage}
        totalPages={totalPages}
        displayMode={displayMode}
        theme={theme}
        zoom={zoom}
        soundEnabled={soundEnabled}
        isFullscreen={isFullscreen}
        showThumbnails={showThumbnails}
        pageSpreadMode={pageSpreadMode}
        isTwoPageSpread={
          !forceMobile &&
          pageSpreadMode !== 'single' &&
          (pageSpreadMode === 'double' ||
            (typeof window !== 'undefined' && window.innerWidth >= 880))
        }
        onPageChange={handlePageChange}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onDisplayModeChange={setDisplayMode}
        onThemeChange={setTheme}
        onToggleSpreadMode={handleToggleSpreadMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleThumbnails={() => setShowThumbnails((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-lg">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tiada Muka Surat Ditemui</h2>
            <p className="text-sm opacity-70">
              E-pamphlet ini belum mempunyai sebarang helaian muka surat yang dimuat naik oleh penganjur.
            </p>
          </div>
        ) : (
          <>
            {displayMode === 'flipbook' && (
              <FlipbookView
                ref={flipbookRef}
                pages={pages}
                currentPage={currentPage}
                zoom={zoom}
                orientation={orientation}
                pageSpreadMode={pageSpreadMode}
                forceMobile={forceMobile}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                onPageChange={handlePageChange}
                onZoomChange={setZoom}
              />
            )}

            {displayMode === 'slide' && (
              <SliderView
                pages={pages}
                currentPage={currentPage}
                zoom={zoom}
                orientation={orientation}
                onPrevPage={() => handlePageChange(Math.max(1, currentPage - 1))}
                onNextPage={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
              />
            )}

            {displayMode === 'vertical' && (
              <VerticalView
                pages={pages}
                zoom={zoom}
                orientation={orientation}
                onPageVisible={(pageNum) => setCurrentPage(pageNum)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Filmstrip Thumbnails Drawer */}
      <ThumbnailsStrip
        pages={pages}
        currentPage={currentPage}
        theme={theme}
        orientation={orientation}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
        onSelectPage={(pageNum) => {
          handlePageChange(pageNum);
          setShowThumbnails(false);
        }}
      />
    </div>
  );
}
