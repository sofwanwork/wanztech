'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form } from '@/lib/types';
import { duplicateFormAction } from '@/actions/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ExternalLink,
  QrCode,
  Loader2,
  Copy,
  Check,
  CopyPlus,
  MoreVertical,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { getProxiedImageUrl, stripHtml } from '@/lib/utils';

interface FormCardProps {
  form: Form;
}

export function FormCard({ form }: FormCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isNavigatingRef = useRef(false);
  const builderHref = `/builder/${form.id}`;

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDuplicating) return;

    setMenuOpen(false);
    setIsDuplicating(true);
    try {
      const res = await duplicateFormAction(form.id);
      if (!res.success || !res.formId) {
        toast.error(res.error || 'Failed to duplicate form.');
        return;
      }
      toast.success(`Duplicated "${res.title}"`, {
        action: {
          label: 'Open Builder',
          onClick: () => router.push(`/builder/${res.formId}`),
        },
      });
      router.refresh();
    } catch {
      toast.error('Failed to duplicate form. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const href = form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`;
    const url = `${window.location.origin}${href}`;

    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    if (isNavigatingRef.current) {
      e.preventDefault();
      return;
    }
    isNavigatingRef.current = true;
    setIsLoading(true);

    // Reset navigation state after a short delay to handle navigation completion
    setTimeout(() => {
      isNavigatingRef.current = false;
      setIsLoading(false);
    }, 3000); // Reset after 3 seconds (navigation should complete by then)
  };

  return (
    <Card className="group hover:border-slate-300 hover:shadow-sm transition-all duration-200 border-slate-200 bg-white overflow-hidden flex flex-col h-full rounded-lg shadow-2xs p-0 gap-0">
      {/* Card Image Area */}
      <Link
        href={builderHref}
        className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden cursor-pointer"
        onClick={handleEditClick}
      >
        {form.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProxiedImageUrl(form.coverImage)}
              alt={form.title?.replace(/\r?\n/g, ' ') || 'Cover'}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300 group-hover:bg-gray-100/50 transition-colors">
            <QrCode className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-xs font-medium opacity-50">No Cover</span>
          </div>
        )}

        {/* Loading / Duplicating Overlay */}
        {(isLoading || isDuplicating) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <span className="text-sm font-medium text-gray-900">
              {isDuplicating ? 'Duplicating Form...' : 'Opening Builder...'}
            </span>
          </div>
        )}

        {/* Overlay with Quick Actions (Hover) - Only show if not loading */}
        {!isLoading && !isDuplicating && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="font-medium min-w-[100px] shadow-lg hover:bg-white transition-colors"
            >
              <span>Edit Form</span>
            </Button>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <CardHeader className="p-5 pb-3 overflow-hidden">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="line-clamp-2 break-words whitespace-pre-line text-lg font-semibold text-gray-900 leading-tight min-w-0 flex-1">
            {form.title}
          </CardTitle>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 -mr-1.5 -mt-0.5 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Form options"
                title="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5 rounded-lg border-slate-200 shadow-md">
              <div className="flex flex-col gap-0.5">
                <Link
                  href={builderHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-500" />
                  Edit Form
                </Link>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-900 rounded-md transition-colors text-left w-full cursor-pointer disabled:opacity-50"
                >
                  <CopyPlus className="h-3.5 w-3.5 text-violet-700" />
                  Duplicate Form
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    handleCopyLink(e);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-left w-full cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Copy Form Link
                </button>
                <Link
                  href={form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`}
                  target="_blank"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  Open Preview
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <CardDescription className="line-clamp-2 text-sm mt-1.5 text-gray-500 h-10 leading-relaxed overflow-hidden max-w-[calc(100%-8px)]">
          {stripHtml(form.description || '') || 'No description provided for this form.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow px-5 py-2">
        {/* Stats placeholder */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            Active
          </div>
          {/* <div>0 Responses</div> */}
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 whitespace-nowrap shrink-0 shadow-2xs"
          suppressHydrationWarning
        >
          {new Date(form.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors shrink-0 cursor-pointer"
            onClick={handleCopyLink}
            title="Copy Form Link"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Link
            href={form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-violet-900 border-violet-200/80 hover:bg-violet-50 hover:text-violet-900 gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer"
            >
              Preview <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
