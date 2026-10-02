'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
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
      width: typeof window !== 'undefined' ? window.innerWidth : 1024,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
    });

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

    // Pan & Drag state when zoomed in
    const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = React.useRef(false);
    const dragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const panStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastClickTimeRef = React.useRef<number>(0);

    // Reset pan offset when zoom returns to 1.0
    React.useEffect(() => {
      if (zoom <= 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
    }, [zoom]);

    // Container-aware sizing via ResizeObserver
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
        setActiveSpread(computeSpread(currentPage, pages));
      }
    }, [currentPage, pages, isFlipping]);

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
        playPageTurnSound();
        const nextPage = Math.min(pages.length, currentPage + 1);
        targetPageRef.current = nextPage;
        targetSpreadRef.current = computeSpread(nextPage, pages);
        setTurningLeaf({
          frontPage: pages[currentPage - 1] || null,
          backPage: pages[nextPage - 1] || null,
        });
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

      playPageTurnSound();

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
    }, [isFlipping, isTwoPageSpread, currentPage, pages, activeSpread]);

    const handleFlipPrev = React.useCallback(() => {
      if (isFlipping) return;

      if (!isTwoPageSpread) {
        if (currentPage <= 1) return;
        playPageTurnSound();
        const prevPage = Math.max(1, currentPage - 1);
        targetPageRef.current = prevPage;
        targetSpreadRef.current = computeSpread(prevPage, pages);
        setTurningLeaf({
          frontPage: pages[currentPage - 1] || null,
          backPage: pages[prevPage - 1] || null,
        });
        setFlipDirection('prev');
        setIsFlipping(true);
        return;
      }

      if (activeSpread.isCover) return;

      playPageTurnSound();

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
    }, [isFlipping, isTwoPageSpread, currentPage, pages, activeSpread]);

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
        setActiveSpread(targetSpreadRef.current);
        const newPage = targetPageRef.current;
        targetSpreadRef.current = null;
        setIsFlipping(false);
        setTurningLeaf(null);

        if (onPageChange) {
          onPageChange(newPage);
        } else if (flipDirection === 'next') {
          onNextPage();
        } else {
          onPrevPage();
        }
      } else {
        setIsFlipping(false);
        setTurningLeaf(null);
      }
    };

    const isLandscape =
      orientation === 'landscape' ||
      (pages && pages[0]?.orientation === 'landscape');

    // Container-aware responsive calculations
    // Available width and height inside the stage container (subtract padding and header/footer)
    const availW = Math.max(260, containerDimensions.width - 24);
    const availH = Math.max(260, containerDimensions.height - 110);

    let bookWidth: number;
    let bookHeight: number;

    if (isTwoPageSpread) {
      // 2-page spread:
      // Portrait spread ratio: (2 / 1.414) ≈ 1.414 : 1
      // Landscape spread ratio: (2 * 1.414) ≈ 2.828 : 1
      const spreadRatio = isLandscape ? 2.828 : 1.414;
      let targetH = Math.min(availH, isLandscape ? 580 : 680);
      let targetW = targetH * spreadRatio;

      if (targetW > availW * 0.94) {
        targetW = availW * 0.94;
        targetH = targetW / spreadRatio;
      }
      bookWidth = Math.round(targetW);
      bookHeight = Math.round(targetH);
    } else {
      // Single page mode (makes text huge on small screens/laptops/mobile!):
      // Portrait single page ratio: (1 / 1.414) ≈ 0.707 : 1
      // Landscape single page ratio: (1.414 / 1) ≈ 1.414 : 1
      const pageRatio = isLandscape ? 1.414 : 0.707;
      let targetH = availH;
      let targetW = targetH * pageRatio;

      if (targetW > availW * 0.94) {
        targetW = availW * 0.94;
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
      isFlipping && flipDirection === 'prev'
        ? targetSpreadRef.current?.leftPage
        : activeSpread.leftPage;

    const displayBaseRightPage =
      isFlipping && flipDirection === 'next'
        ? targetSpreadRef.current?.rightPage
        : activeSpread.rightPage;

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
            <span>Zum {Math.round(zoom * 100)}%</span>
            <span className="opacity-40">•</span>
            <span className="opacity-80">Seret untuk tatal</span>
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
            title="Selak ke Halaman Sebelumnya"
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
            title="Selak ke Halaman Seterusnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* 3D Book Stage Container — Fixed Zoom, Pan, Centered Covers & Perspective */}
        <div
          className="relative flex items-center justify-center select-none"
          style={{
            transform: `translate(${panOffset.x + targetShiftX}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDraggingRef.current ? 'none' : 'transform 520ms cubic-bezier(0.25, 1, 0.5, 1)',
            cursor: zoom > 1 ? (isDraggingRef.current ? 'grabbing' : 'grab') : undefined,
          }}
        >
          {isTwoPageSpread ? (
            /* ========================================================
               DESKTOP TWO-PAGE SPREAD — ROCK-SOLID STATIC CONTAINER
               Spine is locked permanently in the dead-center at 50%.
               ======================================================== */
            <div
              className="relative rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] select-none"
              style={{
                height: `${bookHeight}px`,
                width: `${bookWidth}px`,
                maxWidth: '96vw',
                perspective: '2500px',
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
                  'absolute left-0 top-0 bottom-0 w-1/2 rounded-l-2xl overflow-hidden bg-white border border-black/15 shadow-inner transition-opacity duration-300',
                  activeSpread.isCover && !isFlipping ? 'opacity-0 pointer-events-none' : 'opacity-100',
                  canGoPrev ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoPrev ? 'Klik untuk selak (Dwi-klik untuk zum)' : 'Dwi-klik untuk zum'}
              >
                {displayBaseLeftPage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayBaseLeftPage.imageUrl}
                      alt={displayBaseLeftPage.title || `Halaman ${displayBaseLeftPage.pageNumber}`}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {/* Permanent Spine Crease Shadow (Darkens towards spine on right edge) */}
                    <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                    {/* Ambient cast shadow reacting during flip */}
                    {isFlipping && flipDirection === 'next' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0, 0.25, 0] }}
                        transition={{ duration: 0.52, times: [0, 0.4, 0.85, 1], ease: 'easeInOut' }}
                        className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none z-15"
                      />
                    )}
                    {isFlipping && flipDirection === 'prev' && (
                      <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none z-15"
                      />
                    )}
                  </>
                ) : (
                  /* Closed Book Left Inside Binder / Desk Silhouette */
                  <div className="w-full h-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-r border-black/10">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 mb-3 border border-white/15">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-white/80">Buku Program Digital</p>
                    <p className="text-[11px] text-white/50 mt-1">Klik helaian kanan untuk mula membaca</p>
                  </div>
                )}
              </div>

              {/* 2. CENTER BOOK SPINE (Permanently anchored at 50% center line, elevated z-40) */}
              <div
                className={cn(
                  'absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 z-40 bg-gradient-to-r from-black/50 via-black/25 to-black/50 shadow-inner pointer-events-none transition-opacity duration-300',
                  (activeSpread.isCover || activeSpread.isBackCover) && !isFlipping ? 'opacity-0' : 'opacity-100'
                )}
              />

              {/* 3. RIGHT PAGE BASE (Strictly left: 50%, width: 50%) */}
              <div
                onClick={() => {
                  if (handleDoubleTapOrClick()) return;
                  if (canGoNext) handleFlipNext();
                }}
                className={cn(
                  'absolute right-0 top-0 bottom-0 w-1/2 rounded-r-2xl overflow-hidden bg-white border border-black/15 shadow-inner transition-opacity duration-300',
                  activeSpread.isBackCover && !isFlipping ? 'opacity-0 pointer-events-none' : 'opacity-100',
                  canGoNext ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoNext ? 'Klik untuk selak (Dwi-klik untuk zum)' : 'Dwi-klik untuk zum'}
              >
                {displayBaseRightPage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayBaseRightPage.imageUrl}
                      alt={displayBaseRightPage.title || `Halaman ${displayBaseRightPage.pageNumber}`}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {/* Permanent Spine Crease Shadow (Darkens towards spine on left edge) */}
                    <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                    {/* Ambient cast shadow reacting during flip */}
                    {isFlipping && flipDirection === 'next' && (
                      <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none z-15"
                      />
                    )}
                    {isFlipping && flipDirection === 'prev' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0, 0.25, 0] }}
                        transition={{ duration: 0.52, times: [0, 0.4, 0.85, 1], ease: 'easeInOut' }}
                        className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none z-15"
                      />
                    )}
                  </>
                ) : (
                  /* End of Book Right Inside Binder / Desk Silhouette */
                  <div className="w-full h-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-l border-black/10">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 mb-3 border border-white/15">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-white/80">Tamat Buku Program</p>
                    <p className="text-[11px] text-white/50 mt-1">Klik helaian kiri untuk kembali</p>
                  </div>
                )}
              </div>

              {/* ========================================================
                  4. OVERLAY 3D TURNING LEAF (Active only during the 520ms flip)
                  Anchored strictly on the center spine. Zero layout shift.
                 ======================================================== */}
              {isFlipping && turningLeaf && (
                <>
                  {flipDirection === 'next' ? (
                    /* NEXT FLIP: Leaf starts on right side (left: 50%), rotates around spine (0 -> -180deg) */
                    <motion.div
                      key="desktop-turning-leaf-next"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: -180 }}
                      transition={{
                        duration: 0.52,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      onAnimationComplete={onFlipAnimationComplete}
                      className="absolute top-0 bottom-0 z-30"
                      style={{
                        left: '50%',
                        width: '50%',
                        transformOrigin: 'left center',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front Face of Turning Leaf (Current Right Page before flip) */}
                      <div
                        className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-r-2xl border border-black/10"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
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

                        {/* Permanent Spine Crease Shadow (matching right base page at t=0) */}
                        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                        {/* Dynamic Paper Lighting during rotation */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.35 }}
                          transition={{ duration: 0.26, ease: 'easeIn' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/30 pointer-events-none z-20"
                        />
                      </div>

                      {/* Back Face of Turning Leaf (Destination Left Page after flip) */}
                      <div
                        className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-l-2xl border border-black/10"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
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

                        {/* Permanent Spine Crease Shadow (matching left base page at t=520ms) */}
                        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                        {/* Dynamic Paper Landing Lighting: Starts shaded and brightens as it lands flat */}
                        <motion.div
                          initial={{ opacity: 0.35 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.26, delay: 0.26, ease: 'easeOut' }}
                          className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/30 pointer-events-none z-20"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    /* PREV FLIP: Leaf starts on left side (left: 0), rotates around spine (0 -> 180deg) */
                    <motion.div
                      key="desktop-turning-leaf-prev"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 180 }}
                      transition={{
                        duration: 0.52,
                        ease: [0.25, 1, 0.5, 1],
                      }}
                      onAnimationComplete={onFlipAnimationComplete}
                      className="absolute top-0 bottom-0 z-30"
                      style={{
                        left: '0%',
                        width: '50%',
                        transformOrigin: 'right center',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front Face (Current Left Page before flip) */}
                      <div
                        className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-l-2xl border border-black/10"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
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

                        {/* Permanent Spine Crease Shadow (matching left base page at t=0) */}
                        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                        {/* Dynamic Paper Lighting during rotation */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.35 }}
                          transition={{ duration: 0.26, ease: 'easeIn' }}
                          className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/30 pointer-events-none z-20"
                        />
                      </div>

                      {/* Back Face (Destination Right Page after flip) */}
                      <div
                        className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-r-2xl border border-black/10"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(-180deg)',
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

                        {/* Permanent Spine Crease Shadow (matching right base page at t=520ms) */}
                        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

                        {/* Dynamic Paper Landing Lighting: Starts shaded and brightens as it lands flat */}
                        <motion.div
                          initial={{ opacity: 0.35 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.26, delay: 0.26, ease: 'easeOut' }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/30 pointer-events-none z-20"
                        />
                      </div>
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
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative select-none shadow-2xl rounded-2xl"
              style={{
                height: `${bookHeight}px`,
                width: `${bookWidth}px`,
                maxWidth: '96vw',
                perspective: '2000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Base Page (reveals destination page underneath during turn) */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white cursor-pointer"
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
                title="Klik sisi untuk selak (Dwi-klik untuk zum)"
              >
                {/* Subtle Spine Crease on left edge */}
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />

                {/* Base Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    isFlipping
                      ? pages[targetPageRef.current - 1]?.imageUrl
                      : pages[currentPage - 1]?.imageUrl
                  }
                  alt="Halaman"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Reveal shadow on base page */}
                {isFlipping && (
                  <motion.div
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: 'easeOut' }}
                    className="absolute inset-0 bg-black/30 pointer-events-none z-10"
                  />
                )}
              </div>

              {/* Mobile Turning Leaf — Smooth, natural 3D curl and glide without detachment */}
              {isFlipping && turningLeaf && (
                <motion.div
                  key={`mobile-turning-${currentPage}`}
                  initial={{
                    rotateY: 0,
                    x: '0%',
                    opacity: 1,
                  }}
                  animate={{
                    rotateY: flipDirection === 'next' ? -20 : 20,
                    x: flipDirection === 'next' ? '-105%' : '105%',
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.38,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  onAnimationComplete={onFlipAnimationComplete}
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white z-30"
                  style={{
                    transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={turningLeaf.frontPage?.imageUrl || pages[currentPage - 1]?.imageUrl}
                    alt="Turning Page"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Subtle Spine Crease on left edge (Persistent across flip) */}
                  <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-10" />

                  {/* Dynamic paper lighting/shadow as the page curls away */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ duration: 0.38, ease: 'easeIn' }}
                    className={cn(
                      'absolute inset-0 pointer-events-none',
                      flipDirection === 'next'
                        ? 'bg-gradient-to-r from-transparent via-black/10 to-black/30'
                        : 'bg-gradient-to-l from-transparent via-black/10 to-black/30'
                    )}
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

FlipbookView.displayName = 'FlipbookView';

