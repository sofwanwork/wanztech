import Link from 'next/link';
import { getForms } from '@/lib/storage';
import { getDashboardStats } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExternalLink, QrCode, FileText, ArrowRight, Search } from 'lucide-react';
import { getProxiedImageUrl, stripHtml } from '@/lib/utils';
import { createFormAction } from '@/actions/form';
import { DashboardSearch } from '@/components/dashboard-search';
import { DashboardFilter } from '@/components/dashboard-filter';
import { DashboardStats } from '@/components/dashboard-stats';

interface DashboardPageProps {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    error?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const sort = searchParams?.sort || 'newest';
  const error = searchParams?.error || '';

  const [allForms, stats] = await Promise.all([getForms(), getDashboardStats()]);

  // 1. Filter
  let forms = allForms.filter(
    (form) =>
      form.title.toLowerCase().includes(query.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(query.toLowerCase()))
  );

  // 2. Sort
  forms = forms.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'az':
        return a.title.localeCompare(b.title);
      case 'za':
        return b.title.localeCompare(a.title);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {decodeURIComponent(error)}
        </div>
      )}

      {/* Dashboard Stats */}
      <DashboardStats
        subscription={stats.subscription}
        usage={stats.usage}
        totalForms={stats.totalForms}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Forms</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Manage your forms, analyze responses, and share with the world.
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <DashboardSearch />
          </div>

          <DashboardFilter />

          {/* Mobile Search Button toggle could go here, for now using sidebar create triggers */}
          <div className="md:hidden">
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Visible Area (Optional, if needed for better UX) */}
      <div className="md:hidden">
        <DashboardSearch />
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {forms.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            {query ? (
              <>
                <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No matches found</h3>
                <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
                  No forms found matching &quot;{query}&quot;. Try a different keyword.
                </p>
                <Link href="/">
                  <Button variant="outline">Clear Search</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 transform rotate-3 transition-transform hover:rotate-6">
                  <FileText className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No forms created yet</h3>
                <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
                  Start by creating your first form. It only takes a few seconds to get up and
                  running.
                </p>
                <form
                  action={async () => {
                    'use server';
                    await createFormAction({});
                  }}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30"
                  >
                    Create Form Now
                  </Button>
                </form>
              </>
            )}
          </div>
        )}

        {forms.map((form) => (
          <Card
            key={form.id}
            className="group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 border-gray-100 bg-white overflow-hidden flex flex-col h-full rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:-translate-y-1 p-0 gap-0"
          >
            {/* Card Image Area */}
            <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
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

              {/* Overlay with Quick Actions (Hover) */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                <Link href={`/builder/${form.id}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="font-medium min-w-[100px] shadow-lg hover:bg-white transition-colors"
                  >
                    Edit Form
                  </Button>
                </Link>
              </div>
            </div>

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
        ))}
      </div>
    </div>
  );
}
