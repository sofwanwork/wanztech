'use client';

import React from 'react';
import { PamphletPageItem, PamphletOrientation } from '@/lib/types/pamphlets';
import { cn } from '@/lib/utils';

interface VerticalViewProps {
  pages: PamphletPageItem[];
  zoom: number;
  orientation?: PamphletOrientation;
  onPageVisible: (pageNumber: number) => void;
}

export function VerticalView({
  pages,
  zoom,
  orientation,
  onPageVisible,
}: VerticalViewProps) {
  const pageRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [detectedRatios, setDetectedRatios] = React.useState<Record<number, number>>({});

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

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum) {
              onPageVisible(pageNum);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0.2,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pages, onPageVisible]);

  if (!pages || pages.length === 0) return null;

  const isLandscape = orientation === 'landscape' || pages[0]?.orientation === 'landscape';

  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-28 sm:pb-32 flex flex-col items-center gap-6 scrollbar-thin">
      <div
        className={cn(
          'flex flex-col items-center gap-8 w-full transition-transform duration-200',
          isLandscape ? 'max-w-[min(90vw,780px)]' : 'max-w-[min(88vw,540px)]'
        )}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {pages.map((page, idx) => {
          const itemRatio =
            detectedRatios[page.pageNumber] ||
            page.aspectRatio ||
            pages[0]?.aspectRatio ||
            (isLandscape ? 1.414 : 0.707);

          return (
            <div
              key={page.id}
              data-page-number={page.pageNumber}
              ref={(el) => {
                pageRefs.current[idx] = el;
              }}
              className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white shrink-0"
              style={{ aspectRatio: `${itemRatio} / 1` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.imageUrl}
                alt={page.title || `Page ${page.pageNumber}`}
                onLoad={(e) => handleImageLoad(page.pageNumber, e)}
                className="w-full h-full object-contain pointer-events-none select-none"
                loading="lazy"
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
