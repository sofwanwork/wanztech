'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PamphletPageItem, PamphletTheme } from '@/lib/types/pamphlets';
import { PAMPHLET_THEMES } from '@/lib/pamphlets/themes';
import { cn } from '@/lib/utils';

interface ThumbnailsStripProps {
  pages: PamphletPageItem[];
  currentPage: number;
  theme: PamphletTheme;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageNumber: number) => void;
}

export function ThumbnailsStrip({
  pages,
  currentPage,
  theme,
  isOpen,
  onClose,
  onSelectPage,
}: ThumbnailsStripProps) {
  if (!isOpen) return null;

  const themeObj = PAMPHLET_THEMES[theme] || PAMPHLET_THEMES.dark;

  return (
    <aside
      aria-label="Thumbnails Muka Surat"
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-4xl max-h-56 rounded-2xl border shadow-2xl backdrop-blur-2xl p-3 sm:p-4 flex flex-col gap-2 transition-all animate-in fade-in zoom-in-95 duration-200',
        themeObj.toolbarBg
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2 border-current/15">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            Senarai Halaman ({pages.length})
          </span>
          <span className="text-[11px] opacity-60">
            • Klik untuk terus lompat ke muka surat
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 rounded-md hover:bg-current/15"
          title="Tutup"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Horizontal Scrollable Thumbnails List */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-current/20">
        {pages.map((page) => {
          const isActive = page.pageNumber === currentPage;
          return (
            <button
              key={page.id}
              onClick={() => {
                onSelectPage(page.pageNumber);
              }}
              className={cn(
                'group flex flex-col items-center gap-1.5 shrink-0 transition-all transform hover:-translate-y-1 focus:outline-none',
                isActive && 'scale-105'
              )}
            >
              {/* Thumbnail Image Box */}
              <div
                className={cn(
                  'relative w-20 sm:w-24 aspect-[1/1.414] rounded-lg overflow-hidden border-2 shadow-md bg-black/10 transition-all',
                  isActive
                    ? 'border-primary ring-2 ring-primary/40 shadow-lg'
                    : 'border-current/20 hover:border-primary/60'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.imageUrl}
                  alt={page.title || `Halaman ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Active Indicator Badge */}
                {isActive && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Page Number Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold text-center py-0.5">
                  {page.pageNumber}
                </div>
              </div>

              {/* Title / Label */}
              <span
                className={cn(
                  'text-[10px] max-w-[80px] sm:max-w-[96px] truncate font-medium text-center',
                  isActive ? 'text-primary font-bold' : 'opacity-70 group-hover:opacity-100'
                )}
                title={page.title || `Halaman ${page.pageNumber}`}
              >
                {page.title || `M/S ${page.pageNumber}`}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
