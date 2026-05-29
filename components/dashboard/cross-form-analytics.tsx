import { getUserAnalyticsSummary } from '@/actions/analytics';
import { getFormsSummary } from '@/lib/storage/forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Eye, CheckCircle2, Users, TrendingUp } from 'lucide-react';

/**
 * Cross-form analytics widget for the `/forms` dashboard. Pulls the last 30
 * days of `form_events` across ALL the user's forms, then aggregates into:
 *   - 4 stat cards (views, submits, unique visitors, conv rate)
 *   - 30-day sparkline (views)
 *   - Top 3 forms by submission count
 *
 * Quietly renders nothing when there's no data yet — the dashboard already
 * shows quota stats; we don't need a noisy empty state.
 */
export async function CrossFormAnalytics() {
  const summary = await getUserAnalyticsSummary(30);
  if (!summary || summary.totalViews === 0) return null;

  const forms = await getFormsSummary();
  const formMap = new Map(forms.map((f) => [f.id, f.title]));

  const max = Math.max(1, ...summary.daily.map((d) => d.views));

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Analytics 30 hari
          </CardTitle>
          <span className="text-xs text-muted-foreground">Semua borang</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={summary.totalViews} />
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Pelawat unik"
            value={summary.uniqueVisitors}
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Submits"
            value={summary.totalSubmits}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Conv rate"
            value={`${summary.conversionRate}%`}
          />
        </div>

        {/* Sparkline */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Views harian</p>
          <div className="flex items-end gap-[2px] h-16">
            {summary.daily.map((d) => {
              const h = (d.views / max) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 bg-primary/15 hover:bg-primary/40 transition-colors rounded-sm"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${d.date}: ${d.views} views, ${d.submits} submits`}
                />
              );
            })}
          </div>
        </div>

        {/* Top forms */}
        {summary.topForms.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Top borang (submits)</p>
            <div className="space-y-2">
              {summary.topForms.slice(0, 3).map((f) => {
                const title = formMap.get(f.formId) ?? f.formId;
                return (
                  <Link
                    key={f.formId}
                    href={`/responses/${f.formId}/analytics`}
                    className="flex items-center justify-between gap-3 p-2 rounded-md border hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">
                      {title}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                      <span>{f.views} views</span>
                      <span className="text-green-600 font-semibold">
                        {f.submits} submits
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-gray-50/40">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
