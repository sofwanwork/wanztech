'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';
import { cn } from '@/lib/utils';

interface SliderViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  orientation?: PamphletOrientation;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function SliderView({
  pages,
  currentPage,
  zoom,
  orientation,
  onPrevPage,
  onNextPage,
}: SliderViewProps) {
  const [direction, setDirection] = React.useState(0);
  const prevPageRef = React.useRef(currentPage);

  React.useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setDirection(1);
    } else if (currentPage < prevPageRef.current) {
      setDirection(-1);
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  if (!pages || pages.length === 0) return null;

  const isLandscape = orientation === 'landscape' || pages[0]?.orientation === 'landscape';
  const activePage = pages[currentPage - 1];

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
    <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* Navigation Arrows */}
      {currentPage > 1 && (
        <button
          onClick={onPrevPage}
          className="absolute left-2 sm:left-6 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentPage < pages.length && (
        <button
          onClick={onNextPage}
          className="absolute right-2 sm:right-6 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Halaman Seterusnya"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main Slide Stage */}
      <div
        className={cn(
          'relative max-h-[82vh] flex items-center justify-center transition-all',
          isLandscape ? 'w-auto max-w-[92vw] aspect-[1.414/1]' : 'w-auto aspect-[1/1.414]'
        )}
        style={{
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
              alt={activePage?.title || `Halaman ${currentPage}`}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
