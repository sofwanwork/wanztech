'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Smartphone } from 'lucide-react';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';
import { motion } from 'framer-motion';
import { playPageTurnSound } from '@/lib/pamphlets/utils';
import { cn } from '@/lib/utils';

export interface FlipbookViewRef {
  flipNext: () => void;
  flipPrev: () => void;
}

export interface FlipbookViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  orientation?: PamphletOrientation;
  pageSpreadMode?: 'auto' | 'single' | 'double';
  forceMobile?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange?: (pageNumber: number) => void;
  onZoomChange?: (zoom: number) => void;
  soundEnabled?: boolean;
}

interface SpreadState {
  isCover: boolean;
  isBackCover: boolean;
  leftPage: PamphletPageItem | null;
  rightPage: PamphletPageItem | null;
  leftPageNum: number | null;
  rightPageNum: number | null;
}

export function computeSpread(page: number, pages: PamphletPageItem[]): SpreadState {
  const total = pages.length;
  if (total === 0) {
    return {
      isCover: false,
      isBackCover: false,
      leftPage: null,
      rightPage: null,
      leftPageNum: null,
      rightPageNum: null,
    };
  }

  // Exactly 2 pages in two-page spread: Page 1 on left, Page 2 on right!
  // Neither page is left empty or lonely.
  if (total === 2) {
    return {
      isCover: false,
      isBackCover: false,
      leftPage: pages[0] || null,
      rightPage: pages[1] || null,
      leftPageNum: 1,
      rightPageNum: 2,
    };
  }

  // Cover: Page 1 solo on right side of spine
  if (page <= 1) {
    return {
      isCover: true,
      isBackCover: false,
      leftPage: null,
      rightPage: pages[0] || null,
      leftPageNum: null,
      rightPageNum: 1,
    };
  }

  // Back cover if even total and on the last page solo
  if (page === total && total % 2 === 0 && total > 2) {
    return {
      isCover: false,
      isBackCover: true,
      leftPage: pages[total - 1] || null,
      rightPage: null,
      leftPageNum: total,
      rightPageNum: null,
    };
  }

  // Two-page spread
  const leftNum = page % 2 === 0 ? page : page - 1;
  const rightNum = leftNum + 1;

  return {
    isCover: false,
    isBackCover: false,
    leftPage: pages[leftNum - 1] || null,
    rightPage: pages[rightNum - 1] || null,
    leftPageNum: leftNum,
    rightPageNum: rightNum <= total ? rightNum : null,
  };
}

export const FlipbookView = React.forwardRef<FlipbookViewRef, FlipbookViewProps>(
  function FlipbookView(
    {
      pages,
      currentPage,
      zoom,
      orientation,
      pageSpreadMode = 'auto',
      forceMobile = false,
      soundEnabled = false,
      onPrevPage,
      onNextPage,
      onPageChange,
      onZoomChange,
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = React.useState<{
      width: number;
      height: number;
    }>({
      width: 1024,
      height: 768,
    });
    const [isMounted, setIsMounted] = React.useState(false);

    const [isFlipping, setIsFlipping] = React.useState(false);
    const [flipDirection, setFlipDirection] = React.useState<'next' | 'prev'>('next');
    const [activeSpread, setActiveSpread] = React.useState<SpreadState>(() =>
      computeSpread(currentPage, pages)
    );

    // Snapshot of pages for the turning leaf during animation
    const [turningLeaf, setTurningLeaf] = React.useState<{
      frontPage: PamphletPageItem | null;
      backPage: PamphletPageItem | null;
    } | null>(null);

    // Target spread waiting to be committed after flip animation
    const targetSpreadRef = React.useRef<SpreadState | null>(null);
    const targetPageRef = React.useRef<number>(currentPage);
    const [displayedPage, setDisplayedPage] = React.useState<number>(currentPage);

    // Pan & Drag state when zoomed in
    const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = React.useRef(false);
    const dragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const panStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastClickTimeRef = React.useRef<number>(0);

    // Track naturally loaded image aspect ratios per page to eliminate letterboxing/pillarboxing
    const [detectedRatios, setDetectedRatios] = React.useState<Record<number, number>>({});

    const handleImageLoad = React.useCallback(
      (pageNum: number, e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight && img.naturalHeight > 0) {
          const ratio = +(img.naturalWidth / img.naturalHeight).toFixed(3);
          setDetectedRatios((prev) => {
            if (prev[pageNum] === ratio) return prev;
            return { ...prev, [pageNum]: ratio };
          });
        }
      },
      []
    );

    // Reset pan offset when zoom returns to 1.0
    React.useEffect(() => {
      if (zoom <= 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
    }, [zoom]);

    // Container-aware sizing via ResizeObserver & instant cached image detection (Mount-only)
    React.useEffect(() => {
      if (!containerRef.current) return;
      const updateSize = () => {
        if (!containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerDimensions({ width: clientWidth, height: clientHeight });
        }
      };
      updateSize();

      // Check any already-cached images in DOM for instant aspect ratio detection
      const imgs = containerRef.current.querySelectorAll('img');
      const cachedRatios: Record<number, number> = {};
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth && img.naturalHeight > 0) {
          const ratio = +(img.naturalWidth / img.naturalHeight).toFixed(3);
          cachedRatios[1] = ratio;
        }
      });
      if (Object.keys(cachedRatios).length > 0) {
        setDetectedRatios((prev) => ({ ...cachedRatios, ...prev }));
      }

      setIsMounted(true);

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            setContainerDimensions({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          }
        }
      });
      ro.observe(containerRef.current);
      window.addEventListener('resize', updateSize);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', updateSize);
      };
    }, []);

    // Sync when currentPage changes externally (e.g., from thumbnails drawer)
    React.useEffect(() => {
      if (!isFlipping) {
        setDisplayedPage(currentPage);
        setActiveSpread(computeSpread(currentPage, pages));
      }
    }, [currentPage, pages, isFlipping]);

    // Preload adjacent pages in the background cache so image decodes never delay flip animation
    React.useEffect(() => {
      if (!pages || pages.length === 0) return;
      // Preload all pages for small pamphlets (<= 16 pages) or 5 pages ahead/behind for large ones
      const pagesToPreload =
        pages.length <= 16
          ? pages.map((_, i) => i + 1)
          : Array.from({ length: 11 }, (_, i) => currentPage - 5 + i).filter(
              (p) => p >= 1 && p <= pages.length
            );

      pagesToPreload.forEach((p) => {
        const url = pages[p - 1]?.imageUrl;
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }, [currentPage, pages]);

    // Automatically determine whether to use 2-page spread or single page:
    // 1. If forceMobile or explicit pageSpreadMode === 'single', use 1 page.
    // 2. If pages.length <= 1, single page mode is the only logical view.
    // 3. If pages.length === 2, default to single page (full, centered) unless user explicitly chose 'double'.
    // 4. If pageSpreadMode === 'double', force 2-page spread (if pages.length >= 2).
    // 5. Auto: use 2-page spread only when pages.length > 2 AND container width >= 880px.
    const isTwoPageSpread =
      !forceMobile &&
      pages.length >= 2 &&
      pageSpreadMode !== 'single' &&
      (pageSpreadMode === 'double' || (pages.length > 2 && containerDimensions.width >= 880));

    const canGoPrev = isTwoPageSpread
      ? (!activeSpread.isCover && (activeSpread.leftPageNum ? activeSpread.leftPageNum > 1 : false))
      : currentPage > 1;
    const canGoNext = isTwoPageSpread
      ? (!activeSpread.isBackCover &&
         activeSpread.rightPageNum !== null &&
         activeSpread.rightPageNum < pages.length)
      : currentPage < pages.length;

    /**
     * Triggers a physically realistic 3D page flip with zero layout shift
     */
    const handleFlipNext = React.useCallback(() => {
      if (isFlipping) return;

      if (!isTwoPageSpread) {
        if (currentPage >= pages.length) return;
        if (soundEnabled) playPageTurnSound();
        const nextPage = Math.min(pages.length, currentPage + 1);
        targetPageRef.current = nextPage;
        targetSpreadRef.current = computeSpread(nextPage, pages);
        setTurningLeaf({
          frontPage: pages[currentPage - 1] || null,
          backPage: null,
        });
        setDisplayedPage(nextPage);
        setFlipDirection('next');
        setIsFlipping(true);
        return;
      }

      if (
        activeSpread.isBackCover ||
        (activeSpread.rightPageNum !== null && activeSpread.rightPageNum >= pages.length)
      ) {
        return;
      }

      if (soundEnabled) playPageTurnSound();

      let nextPage: number;
      if (activeSpread.isCover) {
        nextPage = 2;
      } else {
        const currentLeft = activeSpread.leftPageNum || 2;
        nextPage = currentLeft + 2;
        if (nextPage > pages.length) {
          nextPage = pages.length;
        }
      }

      const nextSpread = computeSpread(nextPage, pages);
      targetSpreadRef.current = nextSpread;
      targetPageRef.current = nextPage;

      // Turning leaf: Front face is current right page; Back face is next left page
      setTurningLeaf({
        frontPage: activeSpread.rightPage,
        backPage: nextSpread.leftPage,
      });

      setFlipDirection('next');
      setIsFlipping(true);
    }, [isFlipping, isTwoPageSpread, currentPage, pages, activeSpread, soundEnabled]);

    const handleFlipPrev = React.useCallback(() => {
      if (isFlipping) return;

      if (!isTwoPageSpread) {
        if (currentPage <= 1) return;
        if (soundEnabled) playPageTurnSound();
        const prevPage = Math.max(1, currentPage - 1);
        targetPageRef.current = prevPage;
        targetSpreadRef.current = computeSpread(prevPage, pages);
        setTurningLeaf({
          frontPage: pages[currentPage - 1] || null,
          backPage: null,
        });
        setDisplayedPage(prevPage);
        setFlipDirection('prev');
        setIsFlipping(true);
        return;
      }

      if (activeSpread.isCover) return;

      if (soundEnabled) playPageTurnSound();

      let prevPage: number;
      if (activeSpread.isBackCover) {
        prevPage = pages.length - 2;
      } else if (activeSpread.leftPageNum && activeSpread.leftPageNum <= 2) {
        prevPage = 1;
      } else {
        const currentLeft = activeSpread.leftPageNum || 4;
        prevPage = Math.max(1, currentLeft - 2);
      }

      const prevSpread = computeSpread(prevPage, pages);
      targetSpreadRef.current = prevSpread;
      targetPageRef.current = prevPage;

      // Turning leaf: Front face is current left page; Back face is previous right page
      setTurningLeaf({
        frontPage: activeSpread.leftPage,
        backPage: prevSpread.rightPage,
      });

      setFlipDirection('prev');
      setIsFlipping(true);
    }, [isFlipping, isTwoPageSpread, currentPage, pages, activeSpread, soundEnabled]);

    // Double tap/click detection for quick zoom toggling
    const handleDoubleTapOrClick = React.useCallback(() => {
      const now = Date.now();
        if (now - lastClickTimeRef.current < 320) {
          // Double click detected!
          if (zoom > 1.05) {
            if (onZoomChange) onZoomChange(1.0);
            setPanOffset({ x: 0, y: 0 });
          } else {
            if (onZoomChange) onZoomChange(1.85);
          }
          lastClickTimeRef.current = 0;
          return true;
        }
        lastClickTimeRef.current = now;
        return false;
      },
      [zoom, onZoomChange]
    );

    // Mouse drag-to-pan handlers when zoomed
    const handleMouseDown = (e: React.MouseEvent) => {
      if (zoom <= 1.0) return;
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...panOffset };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingRef.current || zoom <= 1.0) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch swipe gesture handling for mobile screens
    const touchStartXRef = React.useRef<number | null>(null);
    const touchStartYRef = React.useRef<number | null>(null);

    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = React.useCallback(
      (e: React.TouchEvent) => {
        if (touchStartXRef.current === null || touchStartYRef.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
        const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
        touchStartXRef.current = null;
        touchStartYRef.current = null;

        // Ensure horizontal swipe is dominant and exceeds 35px threshold
        if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
          if (deltaX < 0) {
            handleFlipNext();
          } else {
            handleFlipPrev();
          }
        }
      },
      [handleFlipNext, handleFlipPrev]
    );

    // Expose flipNext and flipPrev via ref so external controls (keyboard/toolbar) trigger 3D animation
    React.useImperativeHandle(
      ref,
      () => ({
        flipNext: handleFlipNext,
        flipPrev: handleFlipPrev,
      }),
      [handleFlipNext, handleFlipPrev]
    );

    const onFlipAnimationComplete = () => {
      if (targetSpreadRef.current) {
        const nextSpread = targetSpreadRef.current;
        const newPage = targetPageRef.current;
        setActiveSpread(nextSpread);
        setDisplayedPage(newPage);

        if (onPageChange) {
          onPageChange(newPage);
        } else if (flipDirection === 'next') {
          onNextPage();
        } else {
          onPrevPage();
        }

        // Seamless handoff: delay unmounting the turning leaf by one frame so the
        // underlying base image has fully committed and painted without any 1-frame blink/flash
        requestAnimationFrame(() => {
          setIsFlipping(false);
          setTurningLeaf(null);
          targetSpreadRef.current = null;
        });
      } else {
        setIsFlipping(false);
        setTurningLeaf(null);
      }
    };

    const isLandscape =
      orientation === 'landscape' ||
      (pages && pages[0]?.orientation === 'landscape');

    // Primary document aspect ratio locked across all pages to eliminate container twitch/pulse during page flips
    const documentRatio =
      detectedRatios[1] ||
      pages[0]?.aspectRatio ||
      detectedRatios[currentPage] ||
      pages[currentPage - 1]?.aspectRatio ||
      (isLandscape ? 1.414 : 0.707);

    // Single page aspect ratio (width / height)
    // Uses real document ratio if available, otherwise falls back to standard A4 (1.414 for landscape, 0.707 for portrait)
    const singlePageRatio =
      documentRatio && documentRatio > 0
        ? documentRatio
        : isLandscape
        ? 1.414
        : 0.707;

    const isMobile = forceMobile || containerDimensions.width < 640;
    let bookWidth: number;
    let bookHeight: number;

    if (isTwoPageSpread) {
      // 2-page spread:
      // Spread ratio is double a single page's aspect ratio
      const availW = Math.max(260, containerDimensions.width - 24);
      const availH = Math.max(260, containerDimensions.height - 110);
      const spreadRatio = isLandscape ? singlePageRatio * 2 : (singlePageRatio || 0.707) * 2;
      let targetH = Math.min(availH, isLandscape ? 580 : 680);
      let targetW = targetH * spreadRatio;

      if (targetW > availW * 0.98) {
        targetW = availW * 0.98;
        targetH = targetW / spreadRatio;
      }
      bookWidth = Math.round(targetW);
      bookHeight = Math.round(targetH);
    } else {
      // Single page mode (Comfortable Gallery & Studio Sizing):
      // Balanced sizing with safe clearance from bottom navigation toolbar (no text overlap!)
      const pageRatio = singlePageRatio;

      // Generous side margins on desktop/laptop, comfortable safe margins on mobile
      const availW = isMobile
        ? Math.max(260, isLandscape ? containerDimensions.width - 8 : containerDimensions.width - 20)
        : Math.max(260, Math.min(containerDimensions.width * 0.90, containerDimensions.width - 64));

      // Bottom clearance: 108px on desktop, 76px on mobile ensures toolbar NEVER overlaps bottom content
      const availH = Math.max(200, containerDimensions.height - (isMobile ? 76 : 108));

      let targetH = Math.min(availH, isLandscape ? 560 : 700);
      let targetW = targetH * pageRatio;

      if (targetW > availW) {
        targetW = availW;
        targetH = targetW / pageRatio;
      }

      bookWidth = Math.round(targetW);
      bookHeight = Math.round(targetH);
    }

    // Side margin check to prevent floating buttons from ever overlapping text!
    const sideMargin = (containerDimensions.width - bookWidth) / 2;
    const showFloatingNav = isTwoPageSpread && sideMargin >= 56;

    // Pages currently displayed on the static base layer
    const displayBaseLeftPage =
      isFlipping && flipDirection === 'prev' && targetSpreadRef.current
        ? targetSpreadRef.current.leftPage
        : activeSpread.leftPage;

    const displayBaseRightPage =
      isFlipping && flipDirection === 'next' && targetSpreadRef.current
        ? targetSpreadRef.current.rightPage
        : activeSpread.rightPage;

    const isLeftBaseHidden =
      activeSpread.isCover ||
      (isFlipping && flipDirection === 'prev' && targetSpreadRef.current?.isCover);

    const isRightBaseHidden =
      activeSpread.isBackCover ||
      (isFlipping && flipDirection === 'next' && targetSpreadRef.current?.isBackCover);

    // Calculate stageShiftX to center closed book covers in 2-page spread:
    // - On Front Cover (Page 1 solo on right): shift left by 25% of bookWidth so right page is centered in viewport.
    // - On Back Cover (Last page solo on left): shift right by 25% of bookWidth so left page is centered in viewport.
    // - On Open 2-page spreads or 2-page documents: shift is 0 (centered around spine).
    const getSpreadShiftX = React.useCallback(
      (spread: SpreadState, width: number) => {
        if (!isTwoPageSpread || pages.length <= 2) return 0;
        if (spread.isCover) return -Math.round(width * 0.25);
        if (spread.isBackCover) return Math.round(width * 0.25);
        return 0;
      },
      [isTwoPageSpread, pages.length]
    );

    const targetShiftX = React.useMemo(() => {
      if (!isTwoPageSpread) return 0;
      if (isFlipping && targetSpreadRef.current) {
        return getSpreadShiftX(targetSpreadRef.current, bookWidth);
      }
      return getSpreadShiftX(activeSpread, bookWidth);
    }, [isTwoPageSpread, isFlipping, activeSpread, bookWidth, getSpreadShiftX]);

    if (!pages || pages.length === 0) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
      >
        {/* Subtle Zoom Indicator & Reset Pill when zoomed in */}
        {zoom > 1.0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-2xl border border-white/20 select-none pointer-events-auto">
            <span>Zoom {Math.round(zoom * 100)}%</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80">Drag to pan</span>
            <span className="opacity-40">•</span>
            <button
              type="button"
              onClick={() => {
                if (onZoomChange) onZoomChange(1.0);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="underline hover:text-primary transition-colors cursor-pointer"
            >
              Reset (100%)
            </button>
          </div>
        )}

        {/* Previous Page Floating Circle Button (Displayed only when generous side margin is available) */}
        {showFloatingNav && canGoPrev && (
          <button
            onClick={handleFlipPrev}
            disabled={isFlipping}
            className="flex absolute left-3 sm:left-5 md:left-7 z-40 h-11 w-11 md:h-13 md:w-13 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 disabled:opacity-40 cursor-pointer"
            title="Turn to Previous Page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Page Floating Circle Button (Displayed only when generous side margin is available) */}
        {showFloatingNav && canGoNext && (
          <button
            onClick={handleFlipNext}
            disabled={isFlipping}
            className="flex absolute right-3 sm:right-5 md:right-7 z-40 h-11 w-11 md:h-13 md:w-13 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 disabled:opacity-40 cursor-pointer"
            title="Turn to Next Page"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* 3D Book Stage Container — Fixed Zoom, Pan, Centered Covers & Perspective */}
        <div
          suppressHydrationWarning
          className={cn(
            'relative flex flex-col items-center justify-center select-none transition-opacity duration-200',
            isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{
            transform: `translate(${panOffset.x + targetShiftX}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDraggingRef.current
              ? 'opacity 200ms ease-out'
              : 'transform 540ms cubic-bezier(0.42, 0, 0.58, 1), opacity 200ms ease-out',
            cursor: zoom > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : undefined,
          }}
        >
          {isTwoPageSpread ? (
            /* ========================================================
               DESKTOP TWO-PAGE SPREAD — ROCK-SOLID STATIC CONTAINER
               Spine is locked permanently in the dead-center at 50%.
               ======================================================== */
            <div
              suppressHydrationWarning
              className="relative rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] select-none"
              style={{
                height: `${bookHeight}px`,
                width: `${bookWidth}px`,
                maxWidth: '96vw',
                perspective: '5000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 1. LEFT PAGE BASE (Strictly left: 0, width: 50%) */}
              <div
                onClick={() => {
                  if (handleDoubleTapOrClick()) return;
                  if (canGoPrev) handleFlipPrev();
                }}
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1/2 rounded-l-2xl overflow-hidden bg-white border-y border-l border-r-0 border-black/15',
                  isLeftBaseHidden ? 'opacity-0 pointer-events-none' : 'opacity-100',
                  canGoPrev ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoPrev ? 'Click to turn (Double-click to zoom)' : 'Double-click to zoom'}
              >
                {displayBaseLeftPage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayBaseLeftPage.imageUrl}
                      alt={displayBaseLeftPage.title || `Page ${displayBaseLeftPage.pageNumber}`}
                      onLoad={(e) => handleImageLoad(displayBaseLeftPage.pageNumber, e)}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {/* Subtle Spine Crease Shadow (Portrait only; disabled on landscape spreads) */}
                    {!isLandscape && (
                      <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10" />
                    )}

                    {/* Soft ambient reveal shadow when revealing left page on prev flip */}
                    {isFlipping && flipDirection === 'prev' && (
                      <motion.div
                        initial={{ opacity: 0.25 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.38, ease: 'easeOut' }}
                        className="absolute inset-0 bg-black/20 pointer-events-none z-10"
                      />
                    )}
                  </>
                ) : (
                  /* Closed Book Left Inside Binder / Desk Silhouette */
                  <div className="w-full h-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 mb-3 border border-white/15">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-white/80">Digital Program Book</p>
                    <p className="text-[11px] text-white/50 mt-1">Click right page to start reading</p>
                  </div>
                )}
              </div>

              {/* 2. RIGHT PAGE BASE (Strictly left: 50%, width: 50%) */}
              <div
                onClick={() => {
                  if (handleDoubleTapOrClick()) return;
                  if (canGoNext) handleFlipNext();
                }}
                className={cn(
                  'absolute right-0 top-0 bottom-0 w-1/2 rounded-r-2xl overflow-hidden bg-white border-y border-r border-l-0 border-black/15',
                  isRightBaseHidden ? 'opacity-0 pointer-events-none' : 'opacity-100',
                  canGoNext ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoNext ? 'Click to turn (Double-click to zoom)' : 'Double-click to zoom'}
              >
                {displayBaseRightPage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayBaseRightPage.imageUrl}
                      alt={displayBaseRightPage.title || `Page ${displayBaseRightPage.pageNumber}`}
                      onLoad={(e) => handleImageLoad(displayBaseRightPage.pageNumber, e)}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {/* Subtle Spine Crease Shadow (Portrait only; disabled on landscape spreads) */}
                    {!isLandscape && (
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />
                    )}

                    {/* Soft ambient reveal shadow when revealing right page on next flip */}
                    {isFlipping && flipDirection === 'next' && (
                      <motion.div
                        initial={{ opacity: 0.25 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="absolute inset-0 bg-black/20 pointer-events-none z-10"
                      />
                    )}
                  </>
                ) : (
                  /* End of Book Right Inside Binder / Desk Silhouette */
                  <div className="w-full h-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 mb-3 border border-white/15">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-white/80">End of Program Book</p>
                    <p className="text-[11px] text-white/50 mt-1">Click left page to go back</p>
                  </div>
                )}
              </div>

              {/* ========================================================
                  3. OVERLAY 3D TURNING LEAF (Active only during the 520ms flip)
                  Zero center seam line, seamless joining.
                 ======================================================== */}
              {isFlipping && turningLeaf && (
                <>
                  {flipDirection === 'next' ? (
                    /* NEXT FLIP: Leaf starts on right side (left: 50%), rotates around spine (0 -> -180deg) */
                    <motion.div
                      key="desktop-turning-leaf-next"
                      initial={{
                        rotateY: 0,
                      }}
                      animate={{
                        rotateY: -180,
                      }}
                      transition={{
                        duration: 0.54,
                        ease: [0.42, 0, 0.58, 1],
                      }}
                      onAnimationComplete={onFlipAnimationComplete}
                      className="absolute top-0 bottom-0 z-30 pointer-events-none"
                      style={{
                        left: '50%',
                        width: '50%',
                        transformOrigin: 'left center',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front Face of Turning Leaf (Current Right Page before flip) */}
                      <motion.div
                        initial={{
                          opacity: 1,
                          boxShadow: '0px 0px 0px rgba(0,0,0,0)',
                        }}
                        animate={{
                          opacity: [1, 1, 0, 0],
                          boxShadow: [
                            '0px 0px 0px rgba(0,0,0,0)',
                            '-14px 10px 28px rgba(0,0,0,0.22)',
                            '0px 0px 0px rgba(0,0,0,0)',
                            '0px 0px 0px rgba(0,0,0,0)',
                          ],
                        }}
                        transition={{
                          duration: 0.54,
                          times: [0, 0.495, 0.505, 1],
                          ease: 'linear',
                        }}
                        className="absolute inset-0 bg-white overflow-hidden rounded-r-2xl border-y border-r border-l-0 border-black/15"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg) translateZ(1px)',
                        }}
                      >
                        {turningLeaf.frontPage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={turningLeaf.frontPage.imageUrl}
                            alt="Turning Front"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}

                        {!isLandscape && (
                          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />
                        )}
                      </motion.div>

                      {/* Back Face of Turning Leaf (Destination Left Page after flip) */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          boxShadow: '0px 0px 0px rgba(0,0,0,0)',
                        }}
                        animate={{
                          opacity: [0, 0, 1, 1],
                          boxShadow: [
                            '0px 0px 0px rgba(0,0,0,0)',
                            '0px 0px 0px rgba(0,0,0,0)',
                            '14px 10px 28px rgba(0,0,0,0.22)',
                            '0px 0px 0px rgba(0,0,0,0)',
                          ],
                        }}
                        transition={{
                          duration: 0.54,
                          times: [0, 0.495, 0.505, 1],
                          ease: 'linear',
                        }}
                        className="absolute inset-0 bg-white overflow-hidden rounded-l-2xl border-y border-l border-r-0 border-black/15"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg) translateZ(1px)',
                        }}
                      >
                        {turningLeaf.backPage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={turningLeaf.backPage.imageUrl}
                            alt="Turning Back"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}

                        {!isLandscape && (
                          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10" />
                        )}
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* PREV FLIP: Leaf starts on left side (left: 0), rotates around spine (0 -> 180deg) */
                    <motion.div
                      key="desktop-turning-leaf-prev"
                      initial={{
                        rotateY: 0,
                      }}
                      animate={{
                        rotateY: 180,
                      }}
                      transition={{
                        duration: 0.54,
                        ease: [0.42, 0, 0.58, 1],
                      }}
                      onAnimationComplete={onFlipAnimationComplete}
                      className="absolute top-0 bottom-0 z-30 pointer-events-none"
                      style={{
                        left: '0%',
                        width: '50%',
                        transformOrigin: 'right center',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front Face (Current Left Page before flip) */}
                      <motion.div
                        initial={{
                          opacity: 1,
                          boxShadow: '0px 0px 0px rgba(0,0,0,0)',
                        }}
                        animate={{
                          opacity: [1, 1, 0, 0],
                          boxShadow: [
                            '0px 0px 0px rgba(0,0,0,0)',
                            '14px 10px 28px rgba(0,0,0,0.22)',
                            '0px 0px 0px rgba(0,0,0,0)',
                            '0px 0px 0px rgba(0,0,0,0)',
                          ],
                        }}
                        transition={{
                          duration: 0.54,
                          times: [0, 0.495, 0.505, 1],
                          ease: 'linear',
                        }}
                        className="absolute inset-0 bg-white overflow-hidden rounded-l-2xl border-y border-l border-r-0 border-black/15"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg) translateZ(1px)',
                        }}
                      >
                        {turningLeaf.frontPage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={turningLeaf.frontPage.imageUrl}
                            alt="Turning Front"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}

                        {!isLandscape && (
                          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10" />
                        )}
                      </motion.div>

                      {/* Back Face (Destination Right Page after flip) */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          boxShadow: '0px 0px 0px rgba(0,0,0,0)',
                        }}
                        animate={{
                          opacity: [0, 0, 1, 1],
                          boxShadow: [
                            '0px 0px 0px rgba(0,0,0,0)',
                            '0px 0px 0px rgba(0,0,0,0)',
                            '-14px 10px 28px rgba(0,0,0,0.22)',
                            '0px 0px 0px rgba(0,0,0,0)',
                          ],
                        }}
                        transition={{
                          duration: 0.54,
                          times: [0, 0.495, 0.505, 1],
                          ease: 'linear',
                        }}
                        className="absolute inset-0 bg-white overflow-hidden rounded-r-2xl border-y border-r border-l-0 border-black/15"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(-180deg) translateZ(1px)',
                        }}
                      >
                        {turningLeaf.backPage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={turningLeaf.backPage.imageUrl}
                            alt="Turning Back"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100" />
                        )}

                        {!isLandscape && (
                          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ========================================================
               MOBILE SINGLE PAGE — ROCK-SOLID STATIC CONTAINER
               Locked to exact aspect ratio, no container remounting.
               ======================================================== */
            <div
              suppressHydrationWarning
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={cn(
                'relative select-none shadow-2xl overflow-hidden',
                isLandscape && bookWidth >= containerDimensions.width - 4
                  ? 'rounded-none'
                  : 'rounded-xl sm:rounded-2xl'
              )}
              style={{
                height: `${bookHeight}px`,
                width: `${bookWidth}px`,
                maxWidth: '100%',
                perspective: '2500px',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              {/* Base Page (Stably shows destination page without flicker) */}
              <div
                className={cn(
                  'absolute inset-0 overflow-hidden bg-white cursor-pointer shadow-xl',
                  isLandscape && bookWidth >= containerDimensions.width - 4
                    ? 'rounded-none border-0'
                    : 'rounded-xl sm:rounded-2xl border border-black/15'
                )}
                onClick={(e) => {
                  if (handleDoubleTapOrClick()) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  if (clickX > rect.width / 2) {
                    handleFlipNext();
                  } else {
                    handleFlipPrev();
                  }
                }}
                title="Click side to turn (Double-click to zoom)"
              >
                {/* Subtle Spine Crease on left edge (portrait documents only) */}
                {!isLandscape && (
                  <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />
                )}

                {/* Base Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[displayedPage - 1]?.imageUrl || pages[currentPage - 1]?.imageUrl}
                  alt="Page"
                  onLoad={(e) => handleImageLoad(displayedPage, e)}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Soft ambient reveal shadow on base page under the peel */}
                {isFlipping && (
                  <motion.div
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.48, ease: 'easeOut' }}
                    className="absolute inset-0 bg-black/20 pointer-events-none z-10"
                  />
                )}
              </div>

              {/* Single Page 3D Paper Peel & Curl — Stays strictly inside container, zero bulge, zero flying out */}
              {isFlipping && turningLeaf && (
                <motion.div
                  key={`single-leaf-flip-${displayedPage}-${flipDirection}`}
                  initial={{
                    x: '0%',
                    rotateY: 0,
                    rotateZ: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: flipDirection === 'next' ? '-105%' : '105%',
                    rotateY: flipDirection === 'next' ? -25 : 25,
                    rotateZ: flipDirection === 'next' ? -3 : 3,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.48,
                    ease: [0.45, 0.05, 0.55, 0.95],
                    opacity: {
                      duration: 0.48,
                      times: [0, 0.88, 1],
                    },
                  }}
                  onAnimationComplete={onFlipAnimationComplete}
                  className={cn(
                    'absolute inset-0 z-30 select-none pointer-events-none',
                    isLandscape && bookWidth >= containerDimensions.width - 4
                      ? 'rounded-none'
                      : 'rounded-xl sm:rounded-2xl'
                  )}
                  style={{
                    transformOrigin: flipDirection === 'next' ? 'right center' : 'left center',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front Face of Turning Leaf with 3D Paper Curl Shadow and Sheen */}
                  <div
                    className={cn(
                      'absolute inset-0 overflow-hidden bg-white',
                      flipDirection === 'next'
                        ? 'shadow-[-16px_0_36px_rgba(0,0,0,0.32),-6px_0_12px_rgba(0,0,0,0.2)]'
                        : 'shadow-[16px_0_36px_rgba(0,0,0,0.32),6px_0_12px_rgba(0,0,0,0.2)]',
                      isLandscape && bookWidth >= containerDimensions.width - 4
                        ? 'rounded-none border-0'
                        : 'rounded-xl sm:rounded-2xl border border-black/15'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={turningLeaf.frontPage?.imageUrl || pages[currentPage - 1]?.imageUrl}
                      alt="Turning Page"
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {!isLandscape && (
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />
                    )}

                    {/* 3D Paper Curl Cylindrical Highlight along the peeling edge */}
                    <div
                      className={cn(
                        'absolute inset-y-0 w-28 pointer-events-none opacity-60',
                        flipDirection === 'next'
                          ? 'left-0 bg-gradient-to-r from-white/60 via-black/10 to-transparent'
                          : 'right-0 bg-gradient-to-l from-white/60 via-black/10 to-transparent'
                      )}
                    />

                    {/* Dynamic paper lighting across leaf body as angle changes */}
                    <div
                      className={cn(
                        'absolute inset-0 pointer-events-none opacity-30',
                        flipDirection === 'next'
                          ? 'bg-gradient-to-r from-transparent via-black/5 to-black/25'
                          : 'bg-gradient-to-l from-transparent via-black/5 to-black/25'
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Minimalist Mobile Landscape Hint */}
          {isMobile && isLandscape && zoom <= 1.0 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-current opacity-60 font-medium select-none pointer-events-none transition-opacity">
              <Smartphone className="h-3.5 w-3.5 rotate-90 shrink-0 opacity-80" />
              <span>Rotate phone for full-width • Double-tap to zoom</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FlipbookView.displayName = 'FlipbookView';

