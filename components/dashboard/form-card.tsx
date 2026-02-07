'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Form } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, QrCode, Loader2 } from 'lucide-react';
import { getProxiedImageUrl, stripHtml } from '@/lib/utils';

interface FormCardProps {
  form: Form;
}

export function FormCard({ form }: FormCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isNavigatingRef = useRef(false);
  const builderHref = `/builder/${form.id}`;

  const handleEditClick = (e: React.MouseEvent) => {
    if (isNavigatingRef.current) {
      e.preventDefault();
      return;
    }
    isNavigatingRef.current = true;
    setIsLoading(true);
  };

  return (
    <Card className="group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 border-gray-100 bg-white overflow-hidden flex flex-col h-full rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:-translate-y-1 p-0 gap-0">
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
              alt={form.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300 group-hover:bg-gray-100/50 transition-colors">
            <QrCode className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-xs font-medium opacity-50">No Cover</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <span className="text-sm font-medium text-gray-900">Opening Builder...</span>
          </div>
        )}

        {/* Overlay with Quick Actions (Hover) - Only show if not loading */}
        {!isLoading && (
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
        <div className="flex justify-between items-start gap-2 overflow-hidden">
          <CardTitle className="truncate text-lg font-semibold text-gray-900 leading-tight max-w-[calc(100%-8px)]">
            {form.title}
          </CardTitle>
          {/* Option menu trigger could go here */}
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

      <CardFooter className="p-5 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
          {new Date(form.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <Link
          href={form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary gap-1.5 rounded-full px-4 transition-all hover:pr-5"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
