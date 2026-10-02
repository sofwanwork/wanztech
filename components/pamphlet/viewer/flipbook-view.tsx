'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { PamphletPageItem } from '@/lib/types/pamphlets';
import { motion } from 'framer-motion';
import { playPageTurnSound } from '@/lib/pamphlets/utils';
import { cn } from '@/lib/utils';

export interface FlipbookViewRef {
  flipNext: () => void;
  flipPrev: () => void;
}

interface FlipbookViewProps {
  pages: PamphletPageItem[];
  currentPage: number;
  zoom: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange?: (pageNumber: number) => void;
}

interface SpreadState {
  isCover: boolean;
  isBackCover: boolean;
  leftPage: PamphletPageItem | null;
  rightPage: PamphletPageItem | null;
  leftPageNum: number | null;
  rightPageNum: number | null;
}

function computeSpread(page: number, pages: PamphletPageItem[]): SpreadState {
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
    { pages, currentPage, zoom, onPrevPage, onNextPage, onPageChange },
    ref
  ) {
    const [isDesktop, setIsDesktop] = React.useState(false);
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

    React.useEffect(() => {
      const checkIsDesktop = () => {
        setIsDesktop(window.innerWidth >= 1024);
      };
      checkIsDesktop();
      window.addEventListener('resize', checkIsDesktop);
      return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    // Sync when currentPage changes externally (e.g., from thumbnails drawer)
    React.useEffect(() => {
      if (!isFlipping) {
        setActiveSpread(computeSpread(currentPage, pages));
      }
    }, [currentPage, pages, isFlipping]);

    const canGoPrev = isDesktop ? !activeSpread.isCover : currentPage > 1;
    const canGoNext = isDesktop
      ? !activeSpread.isBackCover &&
        (activeSpread.rightPageNum === null || activeSpread.rightPageNum < pages.length)
      : currentPage < pages.length;

    /**
     * Triggers a physically realistic 3D page flip with zero layout shift
     */
    const handleFlipNext = React.useCallback(() => {
      if (isFlipping) return;

      if (!isDesktop) {
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
    }, [isFlipping, isDesktop, currentPage, pages, activeSpread]);

    const handleFlipPrev = React.useCallback(() => {
      if (isFlipping) return;

      if (!isDesktop) {
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
    }, [isFlipping, isDesktop, currentPage, pages, activeSpread]);

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

    if (!pages || pages.length === 0) {
      return null;
    }

    // Exact fixed CSS calculations so the book never shifts, resizes, or vibrates
    const DESKTOP_BOOK_HEIGHT = 'min(76vh, 650px)';
    const DESKTOP_BOOK_WIDTH = `calc(${DESKTOP_BOOK_HEIGHT} / 1.414 * 2)`;

    const MOBILE_BOOK_HEIGHT = 'min(76vh, 580px)';
    const MOBILE_BOOK_WIDTH = `calc(${MOBILE_BOOK_HEIGHT} / 1.414)`;

    // Pages currently displayed on the static base layer
    const displayBaseLeftPage =
      isFlipping && flipDirection === 'prev'
        ? targetSpreadRef.current?.leftPage
        : activeSpread.leftPage;

    const displayBaseRightPage =
      isFlipping && flipDirection === 'next'
        ? targetSpreadRef.current?.rightPage
        : activeSpread.rightPage;

    return (
      <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden select-none">
        {/* Previous Page Floating Circle Button */}
        {canGoPrev && (
          <button
            onClick={handleFlipPrev}
            disabled={isFlipping}
            className="absolute left-3 sm:left-6 md:left-10 z-40 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 disabled:opacity-40 cursor-pointer"
            title="Selak ke Halaman Sebelumnya"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        )}

        {/* Next Page Floating Circle Button */}
        {canGoNext && (
          <button
            onClick={handleFlipNext}
            disabled={isFlipping}
            className="absolute right-3 sm:right-6 md:right-10 z-40 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 disabled:opacity-40 cursor-pointer"
            title="Selak ke Halaman Seterusnya"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        )}

        {/* 3D Book Stage Container — Fixed Zoom & Perspective */}
        <div
          className="relative flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {isDesktop ? (
            /* ========================================================
               DESKTOP TWO-PAGE SPREAD — ROCK-SOLID STATIC CONTAINER
               Spine is locked permanently in the dead-center at 50%.
               ======================================================== */
            <div
              className="relative rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] select-none"
              style={{
                height: DESKTOP_BOOK_HEIGHT,
                width: DESKTOP_BOOK_WIDTH,
                maxWidth: '92vw',
                perspective: '2500px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 1. LEFT PAGE BASE (Strictly left: 0, width: 50%) */}
              <div
                onClick={canGoPrev ? handleFlipPrev : undefined}
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-1/2 rounded-l-2xl overflow-hidden bg-white border border-black/15 shadow-inner',
                  canGoPrev ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoPrev ? 'Klik untuk selak ke halaman sebelumnya' : undefined}
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
                    {/* Spine Crease Shadow (Darkens towards spine on right edge) */}
                    <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
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

              {/* 2. CENTER BOOK SPINE (Permanently anchored at 50% center line) */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 z-20 bg-gradient-to-r from-black/40 via-black/15 to-black/40 shadow-inner pointer-events-none"
              />

              {/* 3. RIGHT PAGE BASE (Strictly left: 50%, width: 50%) */}
              <div
                onClick={canGoNext ? handleFlipNext : undefined}
                className={cn(
                  'absolute right-0 top-0 bottom-0 w-1/2 rounded-r-2xl overflow-hidden bg-white border border-black/15 shadow-inner',
                  canGoNext ? 'cursor-pointer' : 'cursor-default'
                )}
                title={canGoNext ? 'Klik untuk selak ke halaman seterusnya' : undefined}
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
                    {/* Spine Crease Shadow (Darkens towards spine on left edge) */}
                    <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
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
                        {/* Dynamic Paper Lighting/Shadow during rotation */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.52 }}
                          className="absolute inset-0 bg-gradient-to-l from-black/45 via-black/20 to-transparent pointer-events-none"
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
                        {/* Dynamic Paper Lighting as it lands on left page */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.52 }}
                          className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none"
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.52 }}
                          className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none"
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.52 }}
                          className="absolute inset-0 bg-gradient-to-l from-black/45 via-black/20 to-transparent pointer-events-none"
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
              className="relative select-none shadow-2xl rounded-2xl"
              style={{
                height: MOBILE_BOOK_HEIGHT,
                width: MOBILE_BOOK_WIDTH,
                maxWidth: '92vw',
                perspective: '2000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Base Page (reveals destination page underneath during turn) */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  if (clickX > rect.width / 2) {
                    handleFlipNext();
                  } else {
                    handleFlipPrev();
                  }
                }}
              >
                {/* Spine Crease on left edge */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-10" />

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
                    initial={{ opacity: 0.45 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.42 }}
                    className="absolute inset-0 bg-black/40 pointer-events-none z-10"
                  />
                )}
              </div>

              {/* Mobile Turning Leaf */}
              {isFlipping && turningLeaf && (
                <motion.div
                  key={`mobile-turning-${currentPage}`}
                  initial={{
                    rotateY: 0,
                    x: 0,
                    opacity: 1,
                  }}
                  animate={{
                    rotateY: flipDirection === 'next' ? -80 : 80,
                    x: flipDirection === 'next' ? '-22%' : '22%',
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.42,
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
                  {/* Dynamic paper lighting/shadow as the page curls away */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 0.42 }}
                    className={cn(
                      'absolute inset-0 pointer-events-none',
                      flipDirection === 'next'
                        ? 'bg-gradient-to-r from-black/20 via-black/40 to-black/70'
                        : 'bg-gradient-to-l from-black/20 via-black/40 to-black/70'
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

