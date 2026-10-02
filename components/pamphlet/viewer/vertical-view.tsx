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
    <div className="w-full h-full overflow-y-auto px-4 py-8 flex flex-col items-center gap-6 scrollbar-thin">
      <div
        className={cn(
          'flex flex-col items-center gap-8 w-full transition-transform duration-200',
          isLandscape ? 'max-w-4xl' : 'max-w-2xl'
        )}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {pages.map((page, idx) => (
          <div
            key={page.id}
            data-page-number={page.pageNumber}
            ref={(el) => {
              pageRefs.current[idx] = el;
            }}
            className={cn(
              'relative w-full rounded-2xl overflow-hidden shadow-2xl border border-black/15 bg-white shrink-0',
              isLandscape ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'
            )}
          >
            {/* Page Number Watermark */}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-full z-10">
              {page.pageNumber} / {pages.length}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.imageUrl}
              alt={page.title || `Halaman ${page.pageNumber}`}
              className="w-full h-full object-contain pointer-events-none"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
