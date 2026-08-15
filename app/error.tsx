'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-sm text-gray-500">
        An unexpected error occurred while loading this page. Please try again — if the
        problem persists, contact support and quote the error reference below.
      </p>
      {error.digest && (
        <p className="mb-6 rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-500">
          Ref: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
