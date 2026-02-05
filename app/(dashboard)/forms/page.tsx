import Link from 'next/link';
import { getForms } from '@/lib/storage/forms';
import { getDashboardStats } from '@/lib/storage/subscription';
import { Button } from '@/components/ui/button';

import { ExternalLink, QrCode, FileText, Search } from 'lucide-react';
import { createFormAction } from '@/actions/forms';
import { DashboardSearch } from '@/components/dashboard/search';
import { DashboardFilter } from '@/components/dashboard/filter';
import { DashboardStats } from '@/components/dashboard/stats';
import { FormCard } from '@/components/dashboard/form-card';

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
          <FormCard key={form.id} form={form} />
        ))}
      </div>
    </div>
  );
}
