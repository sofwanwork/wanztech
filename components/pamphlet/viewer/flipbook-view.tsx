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
            pageEl.style.border = '1px solid rgba(203, 213, 225, 0.45)';

            // Inner spine concave gradient shadow in two-page spread (dynamically positions on left/right edge via CSS)
            if (isTwoPageSpread) {
              const shadowEl = document.createElement('div');
              shadowEl.className = 'stf__spine-inner-shadow pointer-events-none';
              pageEl.appendChild(shadowEl);
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
            flippingTime: 450,
            usePortrait: !isTwoPageSpread,
            startPage: startPageIdx,
            startZIndex: 10,
            autoSize: false,
            maxShadowOpacity: 0.48,
            showCover: isTwoPageSpread && totalPages > 2,
            mobileScrollSupport: true,
            showPageCorners: true,
            disableFlipByClick: false,
            useMouseEvents: zoom <= 1,
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
            onPageChange?.(nextPg);
          });

          // Interactive flipping states and audio trigger
          pageFlipInstance.on('changeState', (e: { data: string }) => {
            if (e.data === 'flipping') {
              isTurningRef.current = true;
              if (soundEnabled) {
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
    }, [
      isMounted,
      pages,
      pageWidth,
      bookHeight,
      isTwoPageSpread,
      totalPages,
      soundEnabled,
      zoom,
      onPageChange,
    ]);

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

        {/* Previous Page Floating Circle Button */}
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
            className="flex absolute left-3 sm:left-6 z-40 h-10 w-10 md:h-11 md:w-11 rounded-md bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Previous Page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Page Floating Circle Button */}
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
            className="flex absolute right-3 sm:right-6 z-40 h-10 w-10 md:h-11 md:w-11 rounded-md bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Next Page"
          >
            <ChevronRight className="h-6 w-6" />
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
          {/* Ground Flat Drop Shadow Ellipse */}
          <div
            className="absolute pointer-events-none transition-all duration-500 ease-out z-0"
            style={{
              width: `${bookWidth * 1.05}px`,
              height: isLandscape ? '36px' : '44px',
              bottom: isLandscape ? '-20px' : '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 40%, rgba(0, 0, 0, 0.02) 65%, transparent 78%)',
              filter: 'blur(4px)',
            }}
          />

          {/* StPageFlip Host Container with Realistic 3D Center Spine */}
          <div
            className="relative flex items-center justify-center select-none shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),0_2px_12px_-2px_rgba(0,0,0,0.08)] rounded-md"
            style={{
              width: `${bookWidth}px`,
              height: `${bookHeight}px`,
            }}
          >
            {/* Unmanaged PageFlip Mount Host */}
            <div
              ref={hostRef}
              className="w-full h-full relative"
            />

            {/* Realistic 3D Center Spine System (Tulang Belakang Buku di Tengah) */}
            {isTwoPageSpread && (
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 pointer-events-none z-[12] overflow-hidden flex items-center justify-center">
                {/* Concave spine gutter shadow gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.04) 18%, rgba(0,0,0,0.20) 46%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.20) 54%, rgba(0,0,0,0.04) 82%, transparent 100%)',
                  }}
                />
                {/* Hairline Center Crease with Specular Ridge */}
                <div
                  className="w-[1.5px] h-full"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.35) 100%)',
                    boxShadow: '1px 0 0 rgba(255,255,255,0.2)',
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
