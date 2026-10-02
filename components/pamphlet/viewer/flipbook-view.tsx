'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PamphletPageItem } from '@/lib/types/pamphlets';
import { motion, AnimatePresence } from 'framer-motion';
import { playPageTurnSound } from '@/lib/pamphlets/utils';

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

  // Cover is always Page 1 solo on the right
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

export function FlipbookView({
  pages,
  currentPage,
  zoom,
  onPrevPage,
  onNextPage,
  onPageChange,
}: FlipbookViewProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [isFlipping, setIsFlipping] = React.useState(false);
  const [flipDirection, setFlipDirection] = React.useState<'next' | 'prev'>('next');
  const [activeSpread, setActiveSpread] = React.useState<SpreadState>(() =>
    computeSpread(currentPage, pages)
  );

  // Flipping leaf snapshot (holds the front and back pages during animation)
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

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < pages.length;

  /**
   * Triggers a physically realistic 3D page flip
   */
  const handleFlipNext = () => {
    if (isFlipping || !canGoNext) return;

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
  };

  const handleFlipPrev = () => {
    if (isFlipping || !canGoPrev) return;

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
  };

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

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden select-none">
      {/* Previous Page Floating Circle Button */}
      {canGoPrev && (
        <button
          onClick={handleFlipPrev}
          disabled={isFlipping}
          className="absolute left-2 sm:left-4 md:left-8 z-30 h-11 w-11 md:h-14 md:w-14 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all transform hover:scale-110 active:scale-95 border border-white/20 disabled:opacity-50 cursor-pointer"
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
          className="absolute right-2 sm:right-4 md:right-8 z-30 h-11 w-11 md:h-14 md:w-14 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all transform hover:scale-110 active:scale-95 border border-white/20 disabled:opacity-50 cursor-pointer"
          title="Selak ke Halaman Seterusnya"
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
        {isDesktop ? (
          /* ========================================================
             DESKTOP TWO-PAGE 3D SPREAD MODE
             ======================================================== */
          <div
            className="relative flex items-center shadow-2xl rounded-2xl"
            style={{
              perspective: '2500px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 1. SOLO COVER VIEW (Page 1) */}
            {activeSpread.isCover && !isFlipping && (
              <div
                onClick={handleFlipNext}
                className="relative max-h-[80vh] w-auto aspect-[1/1.414] rounded-r-2xl rounded-l-xs overflow-hidden shadow-2xl border border-black/20 bg-white cursor-pointer group transition-transform duration-300 hover:-rotate-y-2"
                style={{ transformOrigin: 'left center' }}
                title="Klik untuk buka buku program"
              >
                {/* Book Spine Shadow Effect (Left edge) */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
                {/* Soft Surface Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                {/* Turn Hint on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-10" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSpread.rightPage?.imageUrl}
                  alt={activeSpread.rightPage?.title || 'Muka Hadapan (Cover)'}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {/* 2. SOLO BACK COVER VIEW */}
            {activeSpread.isBackCover && !isFlipping && (
              <div
                onClick={handleFlipPrev}
                className="relative max-h-[80vh] w-auto aspect-[1/1.414] rounded-l-2xl rounded-r-xs overflow-hidden shadow-2xl border border-black/20 bg-white cursor-pointer group transition-transform duration-300 hover:rotate-y-2"
                style={{ transformOrigin: 'right center' }}
                title="Klik untuk selak ke belakang"
              >
                {/* Book Spine Shadow Effect (Right edge) */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 via-black/15 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/10 to-transparent pointer-events-none z-10" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSpread.leftPage?.imageUrl}
                  alt={activeSpread.leftPage?.title || 'Halaman Belakang'}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {/* 3. STATIC OPEN SPREAD (When Not Flipping) */}
            {!activeSpread.isCover && !activeSpread.isBackCover && !isFlipping && (
              <div
                className="relative flex items-center max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-black/20 bg-white"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Left Page (Click to flip prev) */}
                <div
                  onClick={handleFlipPrev}
                  className="relative h-full aspect-[1/1.414] max-h-[80vh] overflow-hidden bg-white border-r border-black/10 cursor-pointer group"
                  title="Klik untuk selak ke halaman sebelumnya"
                >
                  {activeSpread.leftPage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeSpread.leftPage.imageUrl}
                        alt={activeSpread.leftPage.title || `Halaman ${activeSpread.leftPage.pageNumber}`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      {/* Spine Crease shadow on the right edge */}
                      <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      {/* Hover tint */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-muted-foreground">
                      (Halaman Kosong)
                    </div>
                  )}
                </div>

                {/* Center Book Spine 3D Groove */}
                <div className="w-2 h-full bg-gradient-to-r from-black/40 via-black/15 to-black/40 z-20 shrink-0 shadow-inner" />

                {/* Right Page (Click to flip next) */}
                <div
                  onClick={handleFlipNext}
                  className="relative h-full aspect-[1/1.414] max-h-[80vh] overflow-hidden bg-white cursor-pointer group"
                  title="Klik untuk selak ke halaman seterusnya"
                >
                  {activeSpread.rightPage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeSpread.rightPage.imageUrl}
                        alt={activeSpread.rightPage.title || `Halaman ${activeSpread.rightPage.pageNumber}`}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      {/* Spine Crease shadow on the left edge */}
                      <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      {/* Hover tint */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-muted-foreground">
                      (Halaman Kosong)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. ACTIVE 3D TURNING ANIMATION STAGE */}
            {isFlipping && turningLeaf && (
              <div
                className="relative flex items-center max-h-[80vh] rounded-2xl overflow-visible shadow-2xl border border-black/20 bg-white"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '2500px',
                }}
              >
                {/* STATIC BASE LEFT PAGE */}
                <div className="relative h-full aspect-[1/1.414] max-h-[80vh] overflow-hidden bg-white border-r border-black/10">
                  {flipDirection === 'next' ? (
                    /* In Next flip: Old left page sits underneath */
                    activeSpread.leftPage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeSpread.leftPage.imageUrl}
                          alt="Halaman Kiri"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-100" />
                    )
                  ) : (
                    /* In Prev flip: Target left page is already visible underneath */
                    targetSpreadRef.current?.leftPage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={targetSpreadRef.current.leftPage.imageUrl}
                          alt="Halaman Kiri Baharu"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-100" />
                    )
                  )}
                </div>

                {/* CENTER SPINE GROOVE */}
                <div className="w-2 h-full bg-gradient-to-r from-black/40 via-black/15 to-black/40 z-20 shrink-0" />

                {/* STATIC BASE RIGHT PAGE */}
                <div className="relative h-full aspect-[1/1.414] max-h-[80vh] overflow-hidden bg-white">
                  {flipDirection === 'next' ? (
                    /* In Next flip: Target right page is already waiting underneath */
                    targetSpreadRef.current?.rightPage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={targetSpreadRef.current.rightPage.imageUrl}
                          alt="Halaman Kanan Baharu"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-100" />
                    )
                  ) : (
                    /* In Prev flip: Old right page sits underneath */
                    activeSpread.rightPage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeSpread.rightPage.imageUrl}
                          alt="Halaman Kanan"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-100" />
                    )
                  )}
                </div>

                {/* ========================================================
                    PHYSICAL 3D TURNING LEAF
                    ======================================================== */}
                {flipDirection === 'next' ? (
                  /* FLIP NEXT: Leaf starts at right side, rotates around left spine (0 to -180deg) */
                  <motion.div
                    key="flipping-leaf-next"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: -180 }}
                    transition={{
                      duration: 0.55,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    onAnimationComplete={onFlipAnimationComplete}
                    className="absolute right-0 top-0 bottom-0 aspect-[1/1.414] max-h-[80vh] z-30"
                    style={{
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* FRONT SIDE OF TURNING LEAF (Faces right before flip) */}
                    <div
                      className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-r-2xl"
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
                      {/* Dynamic Paper Lighting/Shadow as it curls */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.55 }}
                        className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/20 to-transparent pointer-events-none"
                      />
                    </div>

                    {/* BACK SIDE OF TURNING LEAF (Faces left after flip) */}
                    <div
                      className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-l-2xl"
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
                      {/* Dynamic Paper Lighting/Shadow as it lands */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.55 }}
                        className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none"
                      />
                    </div>
                  </motion.div>
                ) : (
                  /* FLIP PREV: Leaf starts at left side, rotates around right spine (0 to 180deg) */
                  <motion.div
                    key="flipping-leaf-prev"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 180 }}
                    transition={{
                      duration: 0.55,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    onAnimationComplete={onFlipAnimationComplete}
                    className="absolute left-0 top-0 bottom-0 aspect-[1/1.414] max-h-[80vh] z-30"
                    style={{
                      transformOrigin: 'right center',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* FRONT SIDE (Faces left before flip) */}
                    <div
                      className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-l-2xl"
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
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.55 }}
                        className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none"
                      />
                    </div>

                    {/* BACK SIDE (Faces right after flip) */}
                    <div
                      className="absolute inset-0 bg-white overflow-hidden shadow-2xl rounded-r-2xl"
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
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.55 }}
                        className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/20 to-transparent pointer-events-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
             MOBILE SINGLE PAGE 3D FLIP MODE
             ======================================================== */
          <div className="relative max-h-[78vh] w-auto aspect-[1/1.414] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                initial={{
                  opacity: 0.5,
                  rotateY: flipDirection === 'next' ? 60 : -60,
                  scale: 0.92,
                }}
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0.5,
                  rotateY: flipDirection === 'next' ? -60 : 60,
                  scale: 0.92,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-black/20 bg-white cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  if (clickX > rect.width / 2) {
                    if (canGoNext) {
                      setFlipDirection('next');
                      playPageTurnSound();
                      if (onPageChange) onPageChange(currentPage + 1);
                      else onNextPage();
                    }
                  } else {
                    if (canGoPrev) {
                      setFlipDirection('prev');
                      playPageTurnSound();
                      if (onPageChange) onPageChange(currentPage - 1);
                      else onPrevPage();
                    }
                  }
                }}
              >
                {/* Book Edge Spine Gradient */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-10" />
                {/* Gentle Surface Lighting Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />

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
