import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFormById } from '@/lib/storage/forms';
import { createClient } from '@/utils/supabase/server';
import { getFormAnalytics } from '@/actions/analytics';
import { AnalyticsClient } from './client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FormAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const form = await getFormById(id);
  if (!form || form.userId !== user.id) notFound();

  const summary = await getFormAnalytics(id, 30);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/responses"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Responses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">
            {form.title}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Analytics — last 30 days</p>
        </div>
      </div>

      <AnalyticsClient summary={summary} fields={form.fields} formId={form.id} />
    </div>
  );
}
