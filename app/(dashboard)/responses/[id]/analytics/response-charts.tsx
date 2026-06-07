'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import {
  getFormResponseSummary,
  type ResponseSummaryResult,
} from '@/actions/response-summary';

const BAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-violet-600',
  'bg-rose-500',
  'bg-cyan-600',
  'bg-orange-500',
  'bg-teal-600',
];

export function ResponseChartsSection({ formId }: { formId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResponseSummaryResult | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFormResponseSummary(formId);
      setData(res);
      if (!res.ok) toast.error(res.error || 'Gagal memuatkan ringkasan jawapan');
    } catch {
      toast.error('Ralat semasa memuatkan ringkasan jawapan');
    } finally {
      setLoading(false);
    }
  };

  const summaries = data?.ok ? (data.summaries ?? []) : [];

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <PieChart className="h-4 w-4 text-primary" /> Answer Summary (from Google Sheet)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-1.5" />
            )}
            {data ? 'Refresh' : 'Generate charts'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {!data && !loading && (
          <p className="text-sm text-gray-500">
            Visualise the actual answers from your Google Sheet (dropdowns, multiple
            choice, checkboxes, ratings). Click <strong>Generate charts</strong>.
          </p>
        )}

        {data?.ok && summaries.length === 0 && (
          <p className="text-sm text-gray-500">
            No chartable questions found. Charts are generated for dropdown,
            multiple-choice, checkbox, and rating fields.
          </p>
        )}

        {data?.ok && summaries.length > 0 && (
          <div className="space-y-6">
            <p className="text-xs text-gray-500">
              Based on {data.totalResponses ?? 0} response
              {(data.totalResponses ?? 0) === 1 ? '' : 's'}.
            </p>
            {summaries.map((s) => {
              const max = Math.max(1, ...s.options.map((o) => o.count));
              return (
                <div key={s.fieldId} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{s.label}</h4>
                    <span className="text-xs text-gray-500">
                      {s.totalAnswered} answered
                      {s.average != null && ` · avg ${s.average}`}
                    </span>
                  </div>
                  {s.options.length === 0 ? (
                    <p className="text-xs text-gray-400">No answers yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {s.options.map((o, i) => (
                        <div key={o.value} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-700 truncate max-w-[65%]" title={o.value}>
                              {o.value || '(empty)'}
                            </span>
                            <span className="text-gray-500">
                              {o.count} ({o.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                              style={{ width: `${Math.round((o.count / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
