'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';

interface SliderViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  orientation?: PamphletOrientation;
  forceMobile?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function SliderView({
  pages,
  currentPage,
  zoom,
  orientation,
  forceMobile = false,
  onPrevPage,
  onNextPage,
}: SliderViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [direction, setDirection] = React.useState(0);
  const prevPageRef = React.useRef(currentPage);
  const [detectedRatios, setDetectedRatios] = React.useState<Record<number, number>>({});
  const [containerDimensions, setContainerDimensions] = React.useState<{
    width: number;
    height: number;
  }>({
    width: 1024,
    height: 768,
  });

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

  React.useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setDirection(1);
    } else if (currentPage < prevPageRef.current) {
      setDirection(-1);
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

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
  const activePage = pages[currentPage - 1];
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

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none"
    >
      {/* Navigation Arrows */}
      {currentPage > 1 && (
        <button
          onClick={onPrevPage}
          className="absolute left-2 sm:left-6 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Previous Page"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentPage < pages.length && (
        <button
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
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 || offset.x < -100) {
                if (currentPage < pages.length) onNextPage();
              } else if (swipe > 10000 || offset.x > 100) {
                if (currentPage > 1) onPrevPage();
              }
            }}
            className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white cursor-grab active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePage?.imageUrl}
              alt={activePage?.title || `Page ${currentPage}`}
              onLoad={(e) => handleImageLoad(currentPage, e)}
              className="w-full h-full object-contain pointer-events-none"
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
