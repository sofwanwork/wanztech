import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <FileQuestion className="h-8 w-8 text-gray-400" />
      </div>
      <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-gray-900">404</h1>
      <h2 className="mb-3 text-xl font-semibold text-gray-900">Page not found</h2>
      <p className="mb-8 max-w-md text-sm text-gray-500">
        The page you are looking for doesn&apos;t exist, may have been removed, or the link
        is incorrect. If you followed a form link, check that it is complete.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Back to homepage</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </div>
  );
}
