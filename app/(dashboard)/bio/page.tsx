import { getBioPages } from '@/lib/storage/bio-links';
import { CreateBioDialog, BioPageCard } from './client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Eye, Sparkles, MousePointerClick } from 'lucide-react';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Bio Links (KlikBio) | KlikForm',
  description: 'Create and manage Linktree-style bio link pages for your social media and marketing.',
};

export default async function BioPagesDashboard() {
  const bioPages = await getBioPages();

  // Get app URL for link previews
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  // Compute aggregate stats
  const totalPages = bioPages.length;
  const totalViews = bioPages.reduce((acc, p) => acc + (p.views || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 md:px-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bio Links (KlikBio)</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> New
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Build your personalized link-in-bio page to share all your forms, social media, and links in one place.
          </p>
        </div>
        <CreateBioDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bio Pages</CardTitle>
            <Layers className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPages}</div>
            <p className="text-xs text-muted-foreground mt-1">Active bio link profiles</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitor impressions</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Power</CardTitle>
            <MousePointerClick className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Mobile optimized & fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Bio Pages Grid / Empty State */}
      {bioPages.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center bg-white/50 backdrop-blur-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Create your first Bio Link page</h3>
            <p className="text-sm text-gray-500">
              Bring all your KlikForm forms, WhatsApp chat links, social profiles, and websites together on one beautiful mobile page.
            </p>
          </div>
          <div className="pt-2">
            <CreateBioDialog buttonText="Get Started with KlikBio" size="lg" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Bio Pages</h2>
            <span className="text-xs text-gray-500">{bioPages.length} of {totalPages} pages</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bioPages.map((page) => (
              <BioPageCard key={page.id} page={page} appUrl={appUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
