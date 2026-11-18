import {
  getPamphlets,
  isPamphletsTableReady,
  PAMPHLETS_SQL_MIGRATION,
} from '@/lib/storage/pamphlets';
import { CreatePamphletDialog, PamphletCard, PamphletDatabaseNotice } from './client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, Sparkles, Layers, ExternalLink } from 'lucide-react';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'E-Pamphlet & Digital Program Books | KlikForm',
  description:
    'Create and share digital program books / event brochures with interactive 3D Flipbook and QR codes.',
};

export default async function PamphletsDashboard() {
  const [pamphlets, isTableReady] = await Promise.all([
    getPamphlets(),
    isPamphletsTableReady(),
  ]);

  // Get app URL for link previews
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  // Compute aggregate stats
  const totalPamphlets = pamphlets.length;
  const totalViews = pamphlets.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalPages = pamphlets.reduce(
    (acc, p) => acc + (Array.isArray(p.pages) ? p.pages.length : 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 md:px-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              E-Pamphlets & Program Books
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              <Sparkles className="w-3 h-3 text-violet-900" /> New
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Build elegant digital event program books with 3D Flipbook effects, touch slider, and print-ready QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href="/p/demo" target="_blank">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>View Live Demo</span>
            </Link>
          </Button>
          <CreatePamphletDialog />
        </div>
      </div>

      {/* Migration Notice if database table is not ready yet */}
      {!isTableReady && (
        <PamphletDatabaseNotice sqlScript={PAMPHLETS_SQL_MIGRATION} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Program Books
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPamphlets}</div>
            <p className="text-xs text-muted-foreground mt-1">E-pamphlets created</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Attendee Views
            </CardTitle>
            <Eye className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Digital scans & reads</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pages
            </CardTitle>
            <Layers className="h-4 w-4 text-violet-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPages}</div>
            <p className="text-xs text-muted-foreground mt-1">Active pages displayed</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid or Empty State */}
      {pamphlets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center bg-white shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-200 text-violet-900 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              Create Your First Digital Program Book
            </h3>
            <p className="text-sm text-slate-600">
              Upload your event brochure pages (PNG/JPG or PDF), organize the program lineup, and share with an elegant QR code to your audience.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <CreatePamphletDialog buttonText="Create E-Pamphlet" size="lg" />
            <Button asChild variant="outline" size="lg" className="rounded-md border-slate-200">
              <Link href="/p/demo" target="_blank" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Preview Sample Program Book</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your E-Pamphlets</h2>
            <span className="text-xs text-gray-500">{pamphlets.length} {pamphlets.length === 1 ? 'record' : 'records'}</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pamphlets.map((p) => (
              <PamphletCard key={p.id} pamphlet={p} appUrl={appUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
