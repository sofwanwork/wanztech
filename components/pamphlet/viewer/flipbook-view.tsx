'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PamphletPageItem } from '@/lib/types/pamphlets';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipbookViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageClick?: (pageNumber: number) => void;
}

export function FlipbookView({
  pages,
  currentPage,
  zoom,
  onPrevPage,
  onNextPage,
}: FlipbookViewProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [flipDirection, setFlipDirection] = React.useState<'next' | 'prev'>('next');
  const prevPageRef = React.useRef(currentPage);

  React.useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  React.useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setFlipDirection('next');
    } else if (currentPage < prevPageRef.current) {
      setFlipDirection('prev');
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  if (!pages || pages.length === 0) {
    return null;
  }

  // Determine pages to show in spread mode (Desktop)
  // Page 1 is solo Cover
  // Pages 2-3 are spread (left: 2, right: 3)
  // Pages 4-5 are spread (left: 4, right: 5)
  // If page is even, leftPage is currentPage, rightPage is currentPage + 1
  // If page is odd and not 1, leftPage is currentPage - 1, rightPage is currentPage
  const isCover = currentPage === 1;

  const leftPageIndex = isCover
    ? -1
    : currentPage % 2 === 0
    ? currentPage - 1
    : currentPage - 2;

  const rightPageIndex = isCover
    ? 0
    : currentPage % 2 === 0
    ? currentPage
    : currentPage - 1;

  const leftPage = leftPageIndex >= 0 && leftPageIndex < pages.length ? pages[leftPageIndex] : null;
  const rightPage = rightPageIndex >= 0 && rightPageIndex < pages.length ? pages[rightPageIndex] : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden select-none">
      {/* Previous Page Navigation Hotspot / Arrow */}
      {currentPage > 1 && (
        <button
          onClick={onPrevPage}
          className="absolute left-2 sm:left-4 md:left-8 z-20 h-11 w-11 md:h-14 md:w-14 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      )}

      {/* Next Page Navigation Hotspot / Arrow */}
      {currentPage < pages.length && (
        <button
          onClick={onNextPage}
          className="absolute right-2 sm:right-4 md:right-8 z-20 h-11 w-11 md:h-14 md:w-14 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all transform hover:scale-110 active:scale-95 border border-white/20"
          title="Halaman Seterusnya"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      )}

      {/* 3D Book Stage Container */}
      <div
        className="relative flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          perspective: '2500px',
        }}
      >
        {/* DESKTOP SPREAD MODE (2 Pages Side-by-Side or Solo Cover) */}
        {isDesktop ? (
          <div className="relative flex items-center shadow-2xl rounded-xl">
            {/* Solo Cover View (Page 1) */}
            {isCover && (
              <motion.div
                key="desktop-cover"
                initial={{ opacity: 0, rotateY: flipDirection === 'prev' ? -20 : 20 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative max-h-[82vh] w-auto aspect-[1/1.414] rounded-r-xl rounded-l-xs overflow-hidden shadow-2xl border border-black/20 bg-white"
              >
                {/* Book Spine Shadow Effect (Left edge) */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
                {/* Cover Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[0].imageUrl}
                  alt={pages[0].title || 'Muka Hadapan'}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </motion.div>
            )}

            {/* Open Spread View (Left Page + Right Page) */}
            {!isCover && (
              <div className="relative flex items-center max-h-[82vh] rounded-xl overflow-hidden shadow-2xl border border-black/20 bg-white">
                {/* Left Page */}
                <div className="relative h-full aspect-[1/1.414] max-h-[82vh] overflow-hidden bg-white border-r border-black/10">
                  {leftPage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={leftPage.imageUrl}
                        alt={leftPage.title || `Halaman ${leftPage.pageNumber}`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      {/* Crease shadow on the right edge of left page */}
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-muted-foreground">
                      (Halaman Kosong)
                    </div>
                  )}
                </div>

                {/* Center Book Spine Groove */}
                <div className="w-1.5 h-full bg-gradient-to-r from-black/40 via-black/15 to-black/40 z-20 shrink-0" />

                {/* Right Page */}
                <div className="relative h-full aspect-[1/1.414] max-h-[82vh] overflow-hidden bg-white">
                  {rightPage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rightPage.imageUrl}
                        alt={rightPage.title || `Halaman ${rightPage.pageNumber}`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      {/* Crease shadow on the left edge of right page */}
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-muted-foreground">
                      (Halaman Kosong)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MOBILE SINGLE PAGE 3D FLIP MODE */
          <div className="relative max-h-[78vh] w-auto aspect-[1/1.414] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                initial={{
                  opacity: 0.3,
                  rotateY: flipDirection === 'next' ? 45 : -45,
                  scale: 0.94,
                }}
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0.3,
                  rotateY: flipDirection === 'next' ? -45 : 45,
                  scale: 0.94,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="relative h-full w-full rounded-xl overflow-hidden shadow-2xl border border-black/20 bg-white"
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Book Edge Spine Gradient */}
                <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none z-10" />
                {/* Gentle Surface Lighting Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />

                {/* Page Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[currentPage - 1]?.imageUrl}
                  alt={pages[currentPage - 1]?.title || `Halaman ${currentPage}`}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
