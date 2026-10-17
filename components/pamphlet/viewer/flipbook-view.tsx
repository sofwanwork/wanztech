'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Smartphone } from 'lucide-react';
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

  // Exactly 2 pages in two-page spread: Page 1 on left, Page 2 on right!
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

/**
 * Standard easeInOutCubic for natural physical page turns
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Maps external page number (1..M) to physical sheet index (0..N)
 */
function getSheetIndexForPage(pageNum: number, totalPages: number): number {
  if (pageNum <= 1) return 0;
  const totalSheets = Math.ceil(totalPages / 2);
  if (pageNum >= totalPages && totalPages % 2 === 0 && totalPages > 2) {
    return totalSheets;
  }
  return Math.min(totalSheets, Math.max(0, Math.floor(pageNum / 2)));
}

/**
 * Maps physical sheet index (0..N) to external primary page number (1..M)
 */
function getPageForSheetIndex(sheetIdx: number, totalPages: number): number {
  if (sheetIdx <= 0) return 1;
  const totalSheets = Math.ceil(totalPages / 2);
  if (sheetIdx >= totalSheets) return totalPages;
  return Math.min(totalPages, sheetIdx * 2);
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
    const bookStageRef = React.useRef<HTMLDivElement>(null);
    const sheetsRef = React.useRef<(HTMLDivElement | null)[]>([]);

    const [containerDimensions, setContainerDimensions] = React.useState<{
      width: number;
      height: number;
    }>({
      width: 1024,
      height: 768,
    });
    const [isMounted, setIsMounted] = React.useState(false);
    const [showCornerHint, setShowCornerHint] = React.useState(true);

    // Number of sheets: each sheet has Front (2i + 1) and Back (2i + 2)
    const totalPages = pages.length;
    const totalSheets = Math.max(1, Math.ceil(totalPages / 2));

    // Current sheet state: how many sheets are flipped over to the left stack (0 .. totalSheets)
    const [currentSheetIndex, setCurrentSheetIndex] = React.useState<number>(() =>
      getSheetIndexForPage(currentPage, totalPages)
    );

    // Pan & Drag state when zoomed in
    const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isPanDraggingRef = React.useRef(false);
    const panDragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const panOffsetStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastClickTimeRef = React.useRef<number>(0);

    // Drag-to-flip interactive state
    const isFlipDraggingRef = React.useRef(false);
    const flipDragStartXRef = React.useRef(0);
    const flipDragStartYRef = React.useRef(0);
    const flipDragSheetIndexRef = React.useRef(-1);
    const flipDragDirectionRef = React.useRef<'forward' | 'backward'>('forward');
    const isAnimatingRef = React.useRef(false);
    const currentAngleRef = React.useRef(0);

    // Auto-detect natural image aspect ratio if not explicitly specified
    const [detectedRatio, setDetectedRatio] = React.useState<number | null>(null);

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
        (containerDimensions.width >= 768 && !isLandscape && totalPages >= 2) ||
        (containerDimensions.width >= 960 && isLandscape && totalPages > 2));

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

    // Helper: compute book pose shift based on sheet state
    const getBookShiftPercent = React.useCallback(
      (sheetIdx: number): number => {
        if (!isTwoPageSpread) return 0;
        if (sheetIdx === 0) return -25; // Closed front cover: shift left 25% to center right page
        if (sheetIdx === totalSheets && totalPages % 2 === 0) return 25; // Closed back cover: shift right 25%
        return 0; // Open spread: centered
      },
      [isTwoPageSpread, totalPages, totalSheets]
    );

    // Apply sheet angle, translateZ lift, and dynamic specular glare
    const applySheetState = React.useCallback(
      (sheetIdx: number, angle: number) => {
        const el = sheetsRef.current[sheetIdx];
        if (!el) return;
        const progress = Math.abs(angle) / 180;
        const shade = Math.sin(Math.min(progress, 1) * Math.PI);
        const liftZ = shade * 18; // 18px page lift peak at 90 deg
        el.style.transform = `translateZ(${liftZ}px) rotateY(${angle}deg)`;
        el.style.setProperty('--shade', shade.toFixed(4));
      },
      []
    );

    // Restack Z-indexes for physical realism
    const restackZIndexes = React.useCallback(() => {
      sheetsRef.current.forEach((sheetEl, i) => {
        if (!sheetEl) return;
        if (i < currentSheetIndex) {
          // Flipped on left stack: sheet i gets i + 1
          sheetEl.style.zIndex = String(i + 1);
          sheetEl.style.transform = 'translateZ(0px) rotateY(-180deg)';
          sheetEl.style.setProperty('--shade', '0');
        } else {
          // Unflipped on right stack: sheet i gets totalSheets - i
          sheetEl.style.zIndex = String(totalSheets - i);
          sheetEl.style.transform = 'translateZ(0px) rotateY(0deg)';
          sheetEl.style.setProperty('--shade', '0');
        }
      });
    }, [currentSheetIndex, totalSheets]);

    // Update book pose position
    const updateBookPose = React.useCallback(
      (shiftPercent?: number) => {
        const shift = shiftPercent !== undefined ? shiftPercent : getBookShiftPercent(currentSheetIndex);
        if (bookStageRef.current) {
          bookStageRef.current.style.setProperty('--book-shift', `${shift}%`);
        }
      },
      [currentSheetIndex, getBookShiftPercent]
    );

    // Mount & Resize observer
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

    // Sync external currentPage changes (e.g. from thumbnail drawer)
    React.useEffect(() => {
      const targetSheet = getSheetIndexForPage(currentPage, totalPages);
      if (targetSheet !== currentSheetIndex && !isAnimatingRef.current && !isFlipDraggingRef.current) {
        // Instant restack for far jumps or external synchronization
        setCurrentSheetIndex(targetSheet);
      }
    }, [currentPage, totalPages, currentSheetIndex]);

    // Apply restack whenever currentSheetIndex or dimensions change
    React.useEffect(() => {
      restackZIndexes();
      updateBookPose();
    }, [currentSheetIndex, restackZIndexes, updateBookPose]);

    // Preload image assets
    React.useEffect(() => {
      if (!pages || pages.length === 0) return;
      pages.forEach((p) => {
        if (p?.imageUrl) {
          const img = new Image();
          img.src = p.imageUrl;
        }
      });
    }, [pages]);

    // Sound player
    const triggerSound = React.useCallback(
      (direction: 'forward' | 'backward' = 'forward') => {
        if (!soundEnabled) return;
        playPageTurnSound(direction);
      },
      [soundEnabled]
    );

    /**
     * Programmatic Flip Next with easeInOutCubic rAF
     */
    const flipNext = React.useCallback(() => {
      if (isAnimatingRef.current || isFlipDraggingRef.current) return;
      if (currentSheetIndex >= totalSheets) return;

      setShowCornerHint(false);
      isAnimatingRef.current = true;
      const sheetIdx = currentSheetIndex;
      const sheetEl = sheetsRef.current[sheetIdx];
      if (sheetEl) sheetEl.style.zIndex = String(totalSheets + 10);

      const startShift = getBookShiftPercent(currentSheetIndex);
      const targetShift = getBookShiftPercent(currentSheetIndex + 1);
      const startTime = performance.now();
      const duration = 720;

      triggerSound('forward');

      function step(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(p);
        const angle = -180 * ease;

        applySheetState(sheetIdx, angle);
        updateBookPose(startShift + (targetShift - startShift) * ease);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          applySheetState(sheetIdx, -180);
          const nextSheet = sheetIdx + 1;
          setCurrentSheetIndex(nextSheet);
          isAnimatingRef.current = false;

          const newPage = getPageForSheetIndex(nextSheet, totalPages);
          if (onPageChange) {
            onPageChange(newPage);
          } else {
            onNextPage();
          }
        }
      }

      requestAnimationFrame(step);
    }, [
      currentSheetIndex,
      totalSheets,
      totalPages,
      getBookShiftPercent,
      applySheetState,
      updateBookPose,
      triggerSound,
      onPageChange,
      onNextPage,
    ]);

    /**
     * Programmatic Flip Prev with easeInOutCubic rAF
     */
    const flipPrev = React.useCallback(() => {
      if (isAnimatingRef.current || isFlipDraggingRef.current) return;
      if (currentSheetIndex <= 0) return;

      setShowCornerHint(false);
      isAnimatingRef.current = true;
      const sheetIdx = currentSheetIndex - 1;
      const sheetEl = sheetsRef.current[sheetIdx];
      if (sheetEl) sheetEl.style.zIndex = String(totalSheets + 10);

      const startShift = getBookShiftPercent(currentSheetIndex);
      const targetShift = getBookShiftPercent(currentSheetIndex - 1);
      const startTime = performance.now();
      const duration = 720;

      triggerSound('backward');

      function step(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(p);
        const angle = -180 + 180 * ease;

        applySheetState(sheetIdx, angle);
        updateBookPose(startShift + (targetShift - startShift) * ease);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          applySheetState(sheetIdx, 0);
          const prevSheet = sheetIdx;
          setCurrentSheetIndex(prevSheet);
          isAnimatingRef.current = false;

          const newPage = getPageForSheetIndex(prevSheet, totalPages);
          if (onPageChange) {
            onPageChange(newPage);
          } else {
            onPrevPage();
          }
        }
      }

      requestAnimationFrame(step);
    }, [
      currentSheetIndex,
      totalSheets,
      totalPages,
      getBookShiftPercent,
      applySheetState,
      updateBookPose,
      triggerSound,
      onPageChange,
      onPrevPage,
    ]);

    // Expose ref
    React.useImperativeHandle(
      ref,
      () => ({
        flipNext,
        flipPrev,
      }),
      [flipNext, flipPrev]
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

    /* ==========================================================================
       TACTILE DRAG-TO-FLIP POINTER CONTROLLERS
       Continuous pointer tracking with setPointerCapture & 32% snap threshold
       ========================================================================== */
    const handlePointerDown = (e: React.PointerEvent) => {
      if (zoom > 1.05 || isAnimatingRef.current) return;
      if (e.button !== 0) return; // Only primary mouse button

      const bookRect = bookStageRef.current?.getBoundingClientRect();
      if (!bookRect) return;

      const clickXOnBook = e.clientX - bookRect.left;
      flipDragStartXRef.current = e.clientX;
      flipDragStartYRef.current = e.clientY;
      isFlipDraggingRef.current = false;

      // Determine eligible sheet and flip direction
      if (clickXOnBook >= bookRect.width / 2) {
        // Right side -> Flip next
        if (currentSheetIndex < totalSheets) {
          flipDragSheetIndexRef.current = currentSheetIndex;
          flipDragDirectionRef.current = 'forward';
        } else {
          flipDragSheetIndexRef.current = -1;
        }
      } else {
        // Left side -> Flip prev
        if (currentSheetIndex > 0) {
          flipDragSheetIndexRef.current = currentSheetIndex - 1;
          flipDragDirectionRef.current = 'backward';
        } else {
          flipDragSheetIndexRef.current = -1;
        }
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (zoom > 1.05 || isAnimatingRef.current) return;
      if (flipDragSheetIndexRef.current === -1) return;

      const deltaX = e.clientX - flipDragStartXRef.current;
      const deltaY = e.clientY - flipDragStartYRef.current;
      const dist = Math.hypot(deltaX, deltaY);

      if (!isFlipDraggingRef.current) {
        if (dist > 6) {
          // Pointer moved > 6px: initiate real drag
          isFlipDraggingRef.current = true;
          setShowCornerHint(false);
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } catch {
            // Ignore capture error if unsupported
          }
          const sheetEl = sheetsRef.current[flipDragSheetIndexRef.current];
          if (sheetEl) sheetEl.style.zIndex = String(totalSheets + 10);
        } else {
          return;
        }
      }

      // Live angle update
      const activeIdx = flipDragSheetIndexRef.current;
      const direction = flipDragDirectionRef.current;
      const halfW = pageWidth;

      let progress = 0;
      let angle = 0;

      if (direction === 'forward') {
        progress = Math.max(0, Math.min(1, -deltaX / halfW));
        angle = -180 * progress;
      } else {
        progress = Math.max(0, Math.min(1, deltaX / halfW));
        angle = -180 + 180 * progress;
      }

      currentAngleRef.current = angle;
      applySheetState(activeIdx, angle);

      // Interpolate book pose shift smoothly
      const startShift = getBookShiftPercent(currentSheetIndex);
      const targetShift =
        direction === 'forward'
          ? getBookShiftPercent(currentSheetIndex + 1)
          : getBookShiftPercent(currentSheetIndex - 1);
      updateBookPose(startShift + (targetShift - startShift) * progress);
    };

    const handlePointerUpOrCancel = (e: React.PointerEvent) => {
      if (zoom > 1.05) return;
      if (flipDragSheetIndexRef.current === -1) return;

      const deltaX = e.clientX - flipDragStartXRef.current;
      const deltaY = e.clientY - flipDragStartYRef.current;
      const dist = Math.hypot(deltaX, deltaY);

      // If pointer moved < 6px, treat as pure click
      if (!isFlipDraggingRef.current && dist < 6) {
        flipDragSheetIndexRef.current = -1;
        if (handleDoubleTapOrClick()) return;

        const bookRect = bookStageRef.current?.getBoundingClientRect();
        if (bookRect) {
          const clickXOnBook = e.clientX - bookRect.left;
          if (clickXOnBook >= bookRect.width / 2) {
            flipNext();
          } else {
            flipPrev();
          }
        }
        return;
      }

      if (!isFlipDraggingRef.current) {
        flipDragSheetIndexRef.current = -1;
        return;
      }

      // Drag completion / release evaluation
      isAnimatingRef.current = true;
      const activeIdx = flipDragSheetIndexRef.current;
      const direction = flipDragDirectionRef.current;
      const halfW = pageWidth;

      let progress = 0;
      if (direction === 'forward') {
        progress = Math.max(0, Math.min(1, -deltaX / halfW));
      } else {
        progress = Math.max(0, Math.min(1, deltaX / halfW));
      }

      const shouldComplete = progress > 0.32; // >32% threshold finishes flip
      const fromAngle = currentAngleRef.current;
      let targetAngle = 0;
      let targetShift = getBookShiftPercent(currentSheetIndex);

      if (direction === 'forward') {
        targetAngle = shouldComplete ? -180 : 0;
        targetShift = shouldComplete
          ? getBookShiftPercent(currentSheetIndex + 1)
          : getBookShiftPercent(currentSheetIndex);
      } else {
        targetAngle = shouldComplete ? 0 : -180;
        targetShift = shouldComplete
          ? getBookShiftPercent(currentSheetIndex - 1)
          : getBookShiftPercent(currentSheetIndex);
      }

      const startShift = getBookShiftPercent(currentSheetIndex);
      const startTime = performance.now();
      const animDuration = Math.max(180, 500 * (1 - Math.abs(targetAngle - fromAngle) / 180));

      if (shouldComplete) {
        triggerSound(direction);
      }

      function springStep(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / animDuration, 1);
        const ease = easeInOutCubic(p);

        const angleNow = fromAngle + (targetAngle - fromAngle) * ease;
        applySheetState(activeIdx, angleNow);

        const shiftNow = startShift + (targetShift - startShift) * ease;
        updateBookPose(shiftNow);

        if (p < 1) {
          requestAnimationFrame(springStep);
        } else {
          applySheetState(activeIdx, targetAngle);
          let newSheetIndex = currentSheetIndex;
          if (shouldComplete) {
            if (direction === 'forward') {
              newSheetIndex = currentSheetIndex + 1;
            } else {
              newSheetIndex = currentSheetIndex - 1;
            }
          }
          setCurrentSheetIndex(newSheetIndex);
          isAnimatingRef.current = false;
          isFlipDraggingRef.current = false;
          flipDragSheetIndexRef.current = -1;

          if (shouldComplete) {
            const newPage = getPageForSheetIndex(newSheetIndex, totalPages);
            if (onPageChange) {
              onPageChange(newPage);
            } else if (direction === 'forward') {
              onNextPage();
            } else {
              onPrevPage();
            }
          }
        }
      }

      requestAnimationFrame(springStep);
    };

    // Navigation buttons state
    const canGoPrev = currentSheetIndex > 0;
    const canGoNext = currentSheetIndex < totalSheets;

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

        {/* Previous Page Floating Circle Button */}
        {canGoPrev && (
          <button
            type="button"
            onClick={flipPrev}
            className="flex absolute left-3 sm:left-6 z-40 h-11 w-11 md:h-12 md:w-12 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Previous Page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Page Floating Circle Button */}
        {canGoNext && (
          <button
            type="button"
            onClick={flipNext}
            className="flex absolute right-3 sm:right-6 z-40 h-11 w-11 md:h-12 md:w-12 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md shadow-2xl transition-transform active:scale-95 border border-white/20 cursor-pointer"
            title="Turn to Next Page"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* 3D Viewport Scene Stage */}
        <div
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
          {/* Perspective container */}
          <div
            style={{
              perspective: '2600px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Ground Flat Drop Shadow Ellipse */}
            <div
              className="absolute pointer-events-none transition-all duration-500 ease-out z-0"
              style={{
                width: isTwoPageSpread
                  ? currentSheetIndex === 0 || currentSheetIndex === totalSheets
                    ? `${pageWidth * 1.08}px`
                    : `${bookWidth * 1.04}px`
                  : `${bookWidth * 1.06}px`,
                height: isLandscape ? '40px' : '48px',
                bottom: isLandscape ? '-22px' : '-28px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.24) 0%, rgba(0, 0, 0, 0.10) 38%, rgba(0, 0, 0, 0.02) 65%, transparent 78%)',
                filter: 'blur(4px)',
              }}
            />

            {/* The 3D Book Entity */}
            <div
              ref={bookStageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              className="relative select-none"
              style={{
                width: `${bookWidth}px`,
                height: `${bookHeight}px`,
                transformStyle: 'preserve-3d',
                transform: isTwoPageSpread
                  ? `translateX(var(--book-shift, -25%)) rotateX(7deg)`
                  : `translateX(0%) rotateX(7deg)`,
                cursor: zoom <= 1 ? 'pointer' : 'default',
              }}
            >
              {/* Stacked Paper Edges on Left Side */}
              {isTwoPageSpread && (
                <div
                  className={cn(
                    'absolute top-1 bottom-1 w-2.5 rounded-l pointer-events-none transition-opacity duration-300 z-10',
                    currentSheetIndex > 0 ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    left: '-9px',
                    background:
                      'repeating-linear-gradient(to left, #c8beab 0px, #f4efe4 1px, #b9ad97 2.5px, #fbf9f4 3.5px)',
                    boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15), -2px 0 5px rgba(0,0,0,0.2)',
                  }}
                />
              )}

              {/* Stacked Paper Edges on Right Side */}
              {isTwoPageSpread && (
                <div
                  className={cn(
                    'absolute top-1 bottom-1 w-2.5 rounded-r pointer-events-none transition-opacity duration-300 z-10',
                    currentSheetIndex < totalSheets ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    right: '-9px',
                    background:
                      'repeating-linear-gradient(to right, #c8beab 0px, #f4efe4 1px, #b9ad97 2.5px, #fbf9f4 3.5px)',
                    boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.15), 2px 0 5px rgba(0,0,0,0.2)',
                  }}
                />
              )}

              {/* Book Spine Center Crease Guide */}
              {isTwoPageSpread && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{
                    left: 'calc(50% - 1px)',
                    width: '2px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
                  }}
                />
              )}

              {/* Physical Sheets Stack */}
              {Array.from({ length: totalSheets }).map((_, sheetIdx) => {
                const frontPageIdx = sheetIdx * 2;
                const backPageIdx = sheetIdx * 2 + 1;
                const frontPage = pages[frontPageIdx] || null;
                const backPage = pages[backPageIdx] || null;

                return (
                  <div
                    key={`sheet-${sheetIdx}`}
                    ref={(el) => {
                      sheetsRef.current[sheetIdx] = el;
                    }}
                    className="absolute top-0 bottom-0 right-0"
                    style={{
                      left: isTwoPageSpread ? '50%' : '0%',
                      width: isTwoPageSpread ? '50%' : '100%',
                      transformStyle: 'preserve-3d',
                      transformOrigin: isTwoPageSpread ? 'left center' : 'center center',
                      willChange: 'transform',
                    }}
                  >
                    {/* Front Face (Odd page number: 1, 3, 5...) */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-white overflow-hidden shadow-[0_4px_24px_-2px_rgba(0,0,0,0.14),0_2px_8px_-1px_rgba(0,0,0,0.08)]',
                        isTwoPageSpread
                          ? 'rounded-r-xl border-y border-r border-slate-300/60'
                          : 'rounded-xl border border-slate-300/60'
                      )}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    >
                      {/* Spine Crease Shadow on Left Edge */}
                      {isTwoPageSpread && (
                        <div
                          className="absolute inset-y-0 left-0 w-5 pointer-events-none z-10"
                          style={{
                            background:
                              'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 6px, transparent 18px)',
                          }}
                        />
                      )}

                      {/* Dynamic Glare Specular Highlight */}
                      <div
                        className="absolute inset-0 pointer-events-none z-20 transition-opacity"
                        style={{
                          opacity: 'calc(var(--shade, 0) * 0.42)',
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)',
                        }}
                      />

                      {/* Page Content */}
                      {frontPage?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={frontPage.imageUrl}
                          alt={frontPage.title || `Page ${frontPageIdx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                          <span className="text-xs font-medium">Halaman {frontPageIdx + 1}</span>
                        </div>
                      )}

                      {/* Pulsing Corner-Curl Hint on Front Cover */}
                      {sheetIdx === 0 && showCornerHint && currentSheetIndex === 0 && (
                        <div
                          className="absolute bottom-2 right-2 w-8 h-8 pointer-events-none z-30 overflow-hidden"
                          style={{
                            background:
                              'linear-gradient(135deg, transparent 50%, rgba(197,160,89,0.35) 50%, rgba(197,160,89,0.75) 100%)',
                            borderBottomRightRadius: '8px',
                          }}
                        />
                      )}
                    </div>

                    {/* Back Face (Even page number: 2, 4, 6...) */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-white overflow-hidden shadow-[0_4px_24px_-2px_rgba(0,0,0,0.14),0_2px_8px_-1px_rgba(0,0,0,0.08)]',
                        isTwoPageSpread
                          ? 'rounded-l-xl border-y border-l border-slate-300/60'
                          : 'rounded-xl border border-slate-300/60'
                      )}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {/* Spine Crease Shadow on Right Edge */}
                      {isTwoPageSpread && (
                        <div
                          className="absolute inset-y-0 right-0 w-5 pointer-events-none z-10"
                          style={{
                            background:
                              'linear-gradient(to left, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 6px, transparent 18px)',
                          }}
                        />
                      )}

                      {/* Dynamic Glare Specular Highlight */}
                      <div
                        className="absolute inset-0 pointer-events-none z-20 transition-opacity"
                        style={{
                          opacity: 'calc(var(--shade, 0) * 0.42)',
                          background:
                            'linear-gradient(225deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)',
                        }}
                      />

                      {/* Page Content */}
                      {backPage?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={backPage.imageUrl}
                          alt={backPage.title || `Page ${backPageIdx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          {backPageIdx < totalPages ? (
                            <>
                              <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                              <span className="text-xs font-medium">Halaman {backPageIdx + 1}</span>
                            </>
                          ) : (
                            <span className="text-xs opacity-30 italic">Kulit Belakang</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimalist Mobile Hint */}
          {!isTwoPageSpread && isLandscape && zoom <= 1.0 && containerDimensions.width < 768 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-current opacity-60 font-medium select-none pointer-events-none transition-opacity">
              <Smartphone className="h-3.5 w-3.5 rotate-90 shrink-0 opacity-80" />
              <span>Rotate phone for wide spread • Drag or click side to turn</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FlipbookView.displayName = 'FlipbookView';
