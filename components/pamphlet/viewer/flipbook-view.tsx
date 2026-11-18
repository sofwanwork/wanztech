'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SizeType } from 'page-flip';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';
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

export interface BookStageLayout {
  isFrontCoverSolo: boolean;
  isBackCoverSolo: boolean;
  isCoverSolo: boolean;
  /** Horizontal translation (px) to keep solo front/back covers centered in the viewport */
  stageShiftX: number;
  /** Left offset (px) inside the book container for the active book drop-shadow */
  activeShadowLeft: number;
  /** Width (px) of the active book drop-shadow (1 page when closed cover, 2 pages when open) */
  activeShadowWidth: number;
  /** Whether the center spine crease should be rendered */
  showCenterSpine: boolean;
}

/**
 * Computes dynamic centering and shadow bounds for 3D flipbook stage so solo covers
 * are centered without an empty-half ghost shadow box.
 */
export function computeBookStageLayout(params: {
  isTwoPageSpread: boolean;
  totalPages: number;
  currentPage: number;
  bookWidth: number;
  pageWidth: number;
}): BookStageLayout {
  const { isTwoPageSpread, totalPages, currentPage, bookWidth, pageWidth } = params;
  const hasSoloCover = isTwoPageSpread && totalPages > 2;
  const isFrontCoverSolo = hasSoloCover && currentPage <= 1;
  const isBackCoverSolo =
    hasSoloCover && currentPage >= totalPages && totalPages % 2 === 0;
  const isCoverSolo = isFrontCoverSolo || isBackCoverSolo;

  const stageShiftX = isFrontCoverSolo
    ? -Math.round(pageWidth / 2)
    : isBackCoverSolo
      ? Math.round(pageWidth / 2)
      : 0;

  const activeShadowWidth = isCoverSolo ? pageWidth : bookWidth;
  const activeShadowLeft = isFrontCoverSolo ? pageWidth : 0;
  const showCenterSpine = isTwoPageSpread && !isCoverSolo;

  return {
    isFrontCoverSolo,
    isBackCoverSolo,
    isCoverSolo,
    stageShiftX,
    activeShadowLeft,
    activeShadowWidth,
    showCenterSpine,
  };
}

/**
 * Computes spread state for 2-page display mode (backward-compatible & tested in Vitest)
 */
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

  // Exactly 2 pages in two-page spread: Page 1 on left, Page 2 on right
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
    const hostRef = React.useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageFlipInstanceRef = React.useRef<any>(null);
    const isTurningRef = React.useRef(false);

    const [containerDimensions, setContainerDimensions] = React.useState<{
      width: number;
      height: number;
    }>({
      width: 1024,
      height: 768,
    });
    const [isMounted, setIsMounted] = React.useState(false);
    const [detectedRatio, setDetectedRatio] = React.useState<number | null>(null);

    // Pan & Drag state when zoomed in
    const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isPanDraggingRef = React.useRef(false);
    const panDragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const panOffsetStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastClickTimeRef = React.useRef<number>(0);

    const totalPages = pages.length;

    // Detect natural image aspect ratio if not explicitly specified
    React.useEffect(() => {
      const firstUrl = pages[0]?.imageUrl;
      if (!firstUrl) return;
      const img = new Image();
      img.src = firstUrl;
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const r = img.naturalWidth / img.naturalHeight;
          setDetectedRatio(r);
        }
      };
    }, [pages]);

    // Track aspect ratios
    const isLandscape =
      orientation === 'landscape' ||
      (pages && pages[0]?.orientation === 'landscape') ||
      (pages && pages[0]?.aspectRatio && pages[0].aspectRatio > 1.05) ||
      (detectedRatio !== null && detectedRatio > 1.05);

    const defaultPageRatio = isLandscape ? 1.414 : 0.707;
    const singlePageRatio = detectedRatio || pages[0]?.aspectRatio || defaultPageRatio;

    // Determine two-page spread status
    const isTwoPageSpread =
      !forceMobile &&
      totalPages >= 2 &&
      pageSpreadMode !== 'single' &&
      (pageSpreadMode === 'double' ||
        (totalPages > 2 &&
          ((containerDimensions.width >= 768 && !isLandscape) ||
            (containerDimensions.width >= 960 && isLandscape))));

    // Calculate dimensions
    let bookWidth: number;
    let bookHeight: number;

    if (isTwoPageSpread) {
      const availW = Math.max(280, containerDimensions.width - 48);
      const availH = Math.max(260, containerDimensions.height - 110);
      const spreadRatio = singlePageRatio * 2;
      let targetH = Math.min(availH, isLandscape ? 580 : 660);
      let targetW = targetH * spreadRatio;

      if (targetW > availW * 0.98) {
        targetW = availW * 0.98;
        targetH = targetW / spreadRatio;
      }
      bookWidth = Math.round(targetW);
      bookHeight = Math.round(targetH);
    } else {
      const availW = Math.max(260, containerDimensions.width - 24);
      const availH = Math.max(200, containerDimensions.height - 96);
      let targetH = Math.min(availH, isLandscape ? 560 : 700);
      let targetW = targetH * singlePageRatio;

      if (targetW > availW) {
        targetW = availW;
        targetH = targetW / singlePageRatio;
      }
      bookWidth = Math.round(targetW);
      bookHeight = Math.round(targetH);
    }

    const pageWidth = isTwoPageSpread ? Math.round(bookWidth / 2) : bookWidth;

    // Measure viewport on mount and on window resize
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

    const currentPageRef = React.useRef(currentPage);
    currentPageRef.current = currentPage;

    const onPageChangeRef = React.useRef(onPageChange);
    onPageChangeRef.current = onPageChange;

    const soundEnabledRef = React.useRef(soundEnabled);
    soundEnabledRef.current = soundEnabled;

    // Instantiate StPageFlip with realistic corner physics
    React.useEffect(() => {
      const hostEl = hostRef.current;
      if (!isMounted || !hostEl || pages.length === 0) return;

      let destroyed = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pageFlipInstance: any = null;

      async function initPageFlip() {
        try {
          const pageFlipModule = await import('page-flip');
          // Support both ESM and CJS bundling wrappers
          const PageFlipClass =
            pageFlipModule.PageFlip ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pageFlipModule as any).default?.PageFlip ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pageFlipModule as any).default;

          if (!PageFlipClass || destroyed || !hostEl) return;

          // Clear previous instance and DOM nodes
          hostEl.innerHTML = '';

          // Create book root mount element inside host
          const bookRoot = document.createElement('div');
          bookRoot.className = 'stf__book-instance';
          hostEl.appendChild(bookRoot);

          // Build HTML page elements
          pages.forEach((page, idx) => {
            const pageEl = document.createElement('div');
            pageEl.className = 'stf__page-item relative bg-white overflow-hidden select-none';
            pageEl.style.width = `${pageWidth}px`;
            pageEl.style.height = `${bookHeight}px`;

            // Set soft density on all pages so every page can be interactively curled and pulled at corners
            pageEl.dataset.density = 'soft';

            // Subtle paper border
            pageEl.style.border = '1px solid rgba(203, 213, 225, 0.55)';

            // Inner spine concave gradient shadow and cylindrical paper sheen in two-page spread
            if (isTwoPageSpread) {
              const shadowEl = document.createElement('div');
              shadowEl.className = 'stf__spine-inner-shadow pointer-events-none';
              pageEl.appendChild(shadowEl);

              const lightingEl = document.createElement('div');
              lightingEl.className = 'stf__page-lighting pointer-events-none';
              pageEl.appendChild(lightingEl);
            }

            // Page content: high-definition image or graceful fallback
            if (page.imageUrl) {
              const img = document.createElement('img');
              img.src = page.imageUrl;
              img.alt = page.title || `Page ${idx + 1}`;
              img.className = 'w-full h-full object-contain pointer-events-none';
              img.draggable = false;
              pageEl.appendChild(img);
            } else {
              const fallback = document.createElement('div');
              fallback.className =
                'w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50';
              fallback.innerHTML = `
                <svg class="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span class="text-xs font-medium">Page ${idx + 1}</span>
              `;
              pageEl.appendChild(fallback);
            }

            bookRoot.appendChild(pageEl);
          });

          const startPageIdx = Math.max(0, Math.min(totalPages - 1, currentPageRef.current - 1));

          pageFlipInstance = new PageFlipClass(bookRoot, {
            width: pageWidth,
            height: bookHeight,
            size: 'fixed' as unknown as SizeType,
            minWidth: 150,
            maxWidth: 2400,
            minHeight: 150,
            maxHeight: 2400,
            drawShadow: true,
            flippingTime: 520,
            usePortrait: !isTwoPageSpread,
            startPage: startPageIdx,
            startZIndex: 10,
            autoSize: false,
            maxShadowOpacity: 0.2,
            showCover: isTwoPageSpread && totalPages > 2,
            mobileScrollSupport: true,
            showPageCorners: true,
            disableFlipByClick: false,
            useMouseEvents: true,
            clickEventForward: true,
          });

          const pageElements = Array.from(
            bookRoot.querySelectorAll('.stf__page-item')
          ) as HTMLElement[];

          pageFlipInstance.loadFromHTML(pageElements);

          // Ensure all pages (including front and back covers) use flexible soft paper
          // so every page can be interactively curled and pulled at the corners
          try {
            const pageCollection = pageFlipInstance.getPageCollection?.();
            if (pageCollection && typeof pageCollection.getPages === 'function') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pageCollection.getPages().forEach((p: any) => {
                p.setDensity('soft');
              });
            }
          } catch {
            // Graceful fallback
          }

          // Page change event listener
          pageFlipInstance.on('flip', (e: { data: number }) => {
            const nextPg = e.data + 1;
            onPageChangeRef.current?.(nextPg);
          });

          // Interactive flipping states and audio trigger
          pageFlipInstance.on('changeState', (e: { data: string }) => {
            if (e.data === 'flipping') {
              isTurningRef.current = true;
              if (soundEnabledRef.current) {
                playPageTurnSound();
              }
            } else if (e.data === 'read') {
              isTurningRef.current = false;
            }
          });

          pageFlipInstanceRef.current = pageFlipInstance;
        } catch (err) {
          console.error('Failed to initialize PageFlip:', err);
        }
      }

      initPageFlip();

      return () => {
        destroyed = true;
        if (pageFlipInstanceRef.current) {
          try {
            pageFlipInstanceRef.current.destroy();
          } catch {
            // Clean teardown
          }
          pageFlipInstanceRef.current = null;
        }
        if (hostEl) {
          hostEl.innerHTML = '';
        }
      };
    }, [isMounted, pages, pageWidth, bookHeight, isTwoPageSpread, totalPages]);

    // External page synchronization (e.g. from thumbnail drawer or toolbar input)
    React.useEffect(() => {
      if (!pageFlipInstanceRef.current || isTurningRef.current) return;
      const targetIdx = Math.max(0, Math.min(totalPages - 1, currentPage - 1));
      try {
        const currentIdx = pageFlipInstanceRef.current.getCurrentPageIndex();
        if (targetIdx !== currentIdx) {
          pageFlipInstanceRef.current.turnToPage(targetIdx);
        }
      } catch {
        // Safe navigation catch
      }
    }, [currentPage, totalPages]);

    // Expose flipNext and flipPrev via ref
    React.useImperativeHandle(
      ref,
      () => ({
        flipNext: () => {
          if (pageFlipInstanceRef.current) {
            try {
              pageFlipInstanceRef.current.flipNext('top');
            } catch {
              onNextPage();
            }
          } else {
            onNextPage();
          }
        },
        flipPrev: () => {
          if (pageFlipInstanceRef.current) {
            try {
              pageFlipInstanceRef.current.flipPrev('top');
            } catch {
              onPrevPage();
            }
          } else {
            onPrevPage();
          }
        },
      }),
      [onNextPage, onPrevPage]
    );

    // Double tap/click detection for quick zoom toggling
    const handleDoubleTapOrClick = React.useCallback(() => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < 320) {
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
    }, [zoom, onZoomChange]);

    // Zoom pan mouse handlers
    const handleMouseDownPan = (e: React.MouseEvent) => {
      if (zoom <= 1.0) return;
      isPanDraggingRef.current = true;
      panDragStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetStartRef.current = { ...panOffset };
    };

    const handleMouseMovePan = (e: React.MouseEvent) => {
      if (!isPanDraggingRef.current || zoom <= 1.0) return;
      const dx = e.clientX - panDragStartRef.current.x;
      const dy = e.clientY - panDragStartRef.current.y;
      setPanOffset({
        x: panOffsetStartRef.current.x + dx,
        y: panOffsetStartRef.current.y + dy,
      });
    };

    const handleMouseUpPan = () => {
      isPanDraggingRef.current = false;
    };

    const canGoPrev = totalPages > 1 && currentPage > 1;
    const canGoNext = totalPages > 1 && currentPage < totalPages;

    const stageLayout = computeBookStageLayout({
      isTwoPageSpread,
      totalPages,
      currentPage,
      bookWidth,
      pageWidth,
    });

    if (!pages || pages.length === 0) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownPan}
        onMouseMove={handleMouseMovePan}
        onMouseUp={handleMouseUpPan}
        onMouseLeave={handleMouseUpPan}
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 select-none overflow-hidden"
        style={{
          touchAction: zoom > 1 ? 'auto' : 'none',
        }}
      >
        {/* Subtle Zoom Pill when zoomed in */}
        {zoom > 1.0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 shadow-2xl border border-white/20 select-none pointer-events-auto">
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

        {/* Previous Page Floating Button */}
        {canGoPrev && (
          <button
            type="button"
            onClick={() => {
              if (pageFlipInstanceRef.current) {
                pageFlipInstanceRef.current.flipPrev('top');
              } else {
                onPrevPage();
              }
            }}
            className="group flex absolute left-3 sm:left-6 z-40 h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-900/65 hover:bg-slate-900/90 text-white items-center justify-center backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Previous Page"
          >
            <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
        )}

        {/* Next Page Floating Button */}
        {canGoNext && (
          <button
            type="button"
            onClick={() => {
              if (pageFlipInstanceRef.current) {
                pageFlipInstanceRef.current.flipNext('top');
              } else {
                onNextPage();
              }
            }}
            className="group flex absolute right-3 sm:right-6 z-40 h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-900/65 hover:bg-slate-900/90 text-white items-center justify-center backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Next Page"
          >
            <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        )}

        {/* 3D Viewport Scene Stage */}
        <div
          onClick={handleDoubleTapOrClick}
          className={cn(
            'relative flex flex-col items-center justify-center transition-opacity duration-300',
            isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            cursor: zoom > 1 ? (isPanDraggingRef.current ? 'grabbing' : 'grab') : 'default',
          }}
        >
          {/* Smoothly Centered Book Stage Wrapper */}
          <div
            className="relative flex items-center justify-center select-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: `${bookWidth}px`,
              height: `${bookHeight}px`,
              transform: `translateX(${stageLayout.stageShiftX}px)`,
            }}
          >
            {/* Adaptive Ground Contact Drop Shadow Ellipse (tracks active page bounds) */}
            <div
              className="absolute pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-0"
              style={{
                width: `${Math.round(stageLayout.activeShadowWidth * 1.06)}px`,
                height: isLandscape ? '38px' : '46px',
                bottom: isLandscape ? '-22px' : '-26px',
                left: `${Math.round(stageLayout.activeShadowLeft + stageLayout.activeShadowWidth / 2)}px`,
                transform: 'translateX(-50%)',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.26) 0%, rgba(15, 23, 42, 0.11) 42%, rgba(15, 23, 42, 0.03) 68%, transparent 82%)',
                filter: 'blur(5px)',
              }}
            />

            {/* Adaptive Book Perimeter Elevation Shadow (never casts ghost shadow on empty cover side) */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-[4px] z-[1]"
              style={{
                left: `${stageLayout.activeShadowLeft}px`,
                width: `${stageLayout.activeShadowWidth}px`,
                boxShadow:
                  '0 20px 48px -10px rgba(15, 23, 42, 0.26), 0 8px 20px -4px rgba(15, 23, 42, 0.14), 0 1px 4px rgba(15, 23, 42, 0.08)',
              }}
            />

            {/* Unmanaged PageFlip Mount Host (disable mouse interaction cleanly during zoom pan without destroying instance) */}
            <div
              ref={hostRef}
              className={cn('w-full h-full relative z-[2]', zoom > 1 && 'pointer-events-none')}
            />

            {/* Realistic 3D Center Spine System (Tulang Belakang Buku di Tengah — hanya apabila buku terbuka) */}
            {isTwoPageSpread && (
              <div
                className={cn(
                  'absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 pointer-events-none z-[12] overflow-hidden flex items-center justify-center transition-opacity duration-300',
                  stageLayout.showCenterSpine ? 'opacity-100' : 'opacity-0'
                )}
              >
                {/* Concave spine gutter shadow gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, transparent 0%, rgba(15,23,42,0.02) 14%, rgba(15,23,42,0.12) 42%, rgba(15,23,42,0.26) 50%, rgba(15,23,42,0.12) 58%, rgba(15,23,42,0.02) 86%, transparent 100%)',
                  }}
                />
                {/* Hairline Center Crease with Dual Specular Ridges */}
                <div
                  className="w-[1.5px] h-full"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0.42) 50%, rgba(15,23,42,0.22) 100%)',
                    boxShadow: '-1px 0 0 rgba(255,255,255,0.2), 1px 0 0 rgba(255,255,255,0.24)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FlipbookView.displayName = 'FlipbookView';
