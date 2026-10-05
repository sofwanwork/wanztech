'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Smartphone, Play, Pause } from 'lucide-react';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';
import { cn } from '@/lib/utils';

export interface SliderViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  orientation?: PamphletOrientation;
  forceMobile?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange?: (pageNumber: number) => void;
  isAutoSliding?: boolean;
  onToggleAutoSlide?: () => void;
}

export function SliderView({
  pages,
  currentPage,
  zoom,
  orientation,
  forceMobile = false,
  onPrevPage,
  onNextPage,
  onPageChange,
  isAutoSliding = false,
  onToggleAutoSlide,
}: SliderViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Synchronous direction tracking during render to prevent stale or inverted transitions
  const [[page, direction], setPageAndDirection] = React.useState([currentPage, 0]);

  if (page !== currentPage) {
    setPageAndDirection([currentPage, currentPage > page ? 1 : -1]);
  }

  const [detectedRatios, setDetectedRatios] = React.useState<Record<number, number>>({});
  const [containerDimensions, setContainerDimensions] = React.useState<{
    width: number;
    height: number;
  }>({
    width: 1024,
    height: 768,
  });

  // Preload all slide images into browser cache so transitions never render blank images
  React.useEffect(() => {
    if (!pages || pages.length === 0) return;
    pages.forEach((p) => {
      if (p.imageUrl) {
        const img = new Image();
        img.src = p.imageUrl;
      }
    });
  }, [pages]);

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

  if (!pages || pages.length === 0) return null;

  const isLandscape = orientation === 'landscape' || pages[0]?.orientation === 'landscape';
  const safeIndex = Math.max(0, Math.min(pages.length - 1, currentPage - 1));
  const activePage = pages[safeIndex];
  const pageRatio =
    detectedRatios[currentPage] ||
    activePage?.aspectRatio ||
    pages[0]?.aspectRatio ||
    (isLandscape ? 1.414 : 0.707);

  // Sizing identical to comfortable gallery & single-page flipbook view:
  const isMobile = forceMobile || containerDimensions.width < 640;

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

  const slideWidth = Math.round(targetW);
  const slideHeight = Math.round(targetH);

  // Simultaneous slide transitions with popLayout to eliminate blank gaps
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir >= 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
    >
      {/* Floating Auto-Slider Control Pill */}
      {pages.length > 1 && onToggleAutoSlide && (
        <div className="absolute top-3 sm:top-5 z-20 flex items-center justify-center pointer-events-auto">
          <button
            type="button"
            onClick={onToggleAutoSlide}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95',
              isAutoSliding
                ? 'bg-primary text-primary-foreground border-primary/40 shadow-primary/30 ring-2 ring-primary/40'
                : 'bg-black/45 hover:bg-black/70 text-white border-white/20 hover:border-white/40'
            )}
            title={isAutoSliding ? 'Pause Auto Slider' : 'Start Auto Slider (Slideshow)'}
          >
            {isAutoSliding ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>Auto Slide: Playing</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current shrink-0 ml-0.5" />
                <span>Auto Slide</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Navigation Arrows */}
      {currentPage > 1 && (
        <button
          type="button"
          onClick={onPrevPage}
          className="absolute left-2 sm:left-6 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Previous Page"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentPage < pages.length && (
        <button
          type="button"
          onClick={onNextPage}
          className="absolute right-2 sm:right-6 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Next Page"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main Slide Stage (Comfortable Studio Dimensions) */}
      <div
        className="relative flex items-center justify-center transition-all select-none"
        style={{
          width: `${slideWidth}px`,
          height: `${slideHeight}px`,
          maxWidth: '96vw',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 32 },
              opacity: { duration: 0.22 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(e, { offset, velocity }) => {
              const swipePower = Math.abs(offset.x) * velocity.x;
              // Swiping Left (dragging to the left) -> Next Page
              if (swipePower < -5000 || offset.x < -60) {
                if (currentPage < pages.length) {
                  onNextPage();
                } else if (pages.length > 1) {
                  onPageChange?.(1);
                }
              }
              // Swiping Right (dragging to the right) -> Prev Page
              else if (swipePower > 5000 || offset.x > 60) {
                if (currentPage > 1) {
                  onPrevPage();
                } else if (pages.length > 1) {
                  onPageChange?.(pages.length);
                }
              }
            }}
            className="absolute inset-0 h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white cursor-grab active:cursor-grabbing flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePage?.imageUrl}
              alt={activePage?.title || `Page ${currentPage}`}
              onLoad={(e) => handleImageLoad(currentPage, e)}
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimalist Mobile Landscape Hint */}
      {isMobile && isLandscape && zoom <= 1.0 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-current opacity-60 font-medium select-none pointer-events-none transition-opacity">
          <Smartphone className="h-3.5 w-3.5 rotate-90 shrink-0 opacity-80" />
          <span>Rotate phone for full-width • Double-tap to zoom</span>
        </div>
      )}
    </div>
  );
}
