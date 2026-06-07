'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormField } from '@/lib/types';
import type { FormAnalyticsSummary } from '@/lib/analytics/aggregate';
import { Eye, MousePointerClick, CheckCircle2, Users, Clock, BarChart3 } from 'lucide-react';

interface AnalyticsClientProps {
  summary: FormAnalyticsSummary | null;
  fields: FormField[];
  formId: string;
}

export function AnalyticsClient({ summary, fields }: AnalyticsClientProps) {
  if (!summary) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-12 text-center text-gray-500">
          Failed to load analytics. Try refreshing the page.
        </CardContent>
      </Card>
    );
  }

  const noData = summary.totalViews === 0;
  const fieldLabel = (id: string) => fields.find((f) => f.id === id)?.label ?? id;

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Views"
          value={summary.totalViews}
          color="blue"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Unique visitors"
          value={summary.uniqueVisitors}
          color="indigo"
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Starts"
          value={summary.totalStarts}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Submits"
          value={summary.totalSubmits}
          color="green"
        />
      </div>

      {/* Conversion funnel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RateCard
          label="View → Submit"
          rate={summary.conversionRate}
          subtitle="Conversion rate"
        />
        <RateCard
          label="Start → Submit"
          rate={summary.completionRate}
          subtitle="Completion rate (of those who started)"
        />
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Avg time to submit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-2xl font-bold text-gray-900">
              {summary.avgSubmitSeconds == null
                ? '—'
                : `${formatDuration(summary.avgSubmitSeconds)}`}
            </div>
            <p className="text-xs text-gray-500 mt-1">{summary.totalAbandons} abandoned sessions</p>
          </CardContent>
        </Card>
      </div>

      {noData && (
        <Card className="border border-dashed border-gray-300 bg-gray-50/50">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No analytics data yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Share your form link. Data appears within seconds of the first visit.
            </p>
          </CardContent>
        </Card>
      )}

      {!noData && (
        <>
          {/* Daily trend */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Last 30 days
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <DailyChart daily={summary.daily} />
            </CardContent>
          </Card>

          {/* Two-column: devices + field engagement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-gray-900">Devices</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                {(['desktop', 'mobile', 'tablet', 'bot', 'unknown'] as const).map((d) => {
                  const count = summary.devices[d];
                  const total =
                    summary.devices.desktop +
                    summary.devices.mobile +
                    summary.devices.tablet +
                    summary.devices.bot +
                    summary.devices.unknown;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={d} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize text-gray-700">{d}</span>
                        <span className="text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-700 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Field engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                {summary.fieldEngagement.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No field-level data yet. This collects when respondents focus into each field.
                  </p>
                )}
                {summary.fieldEngagement.slice(0, 8).map((f) => {
                  const max = summary.fieldEngagement[0]?.focuses ?? 1;
                  const pct = Math.round((f.focuses / max) * 100);
                  return (
                    <div key={f.fieldId} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate max-w-[60%]">
                          {fieldLabel(f.fieldId)}
                        </span>
                        <span className="text-gray-500">
                          {f.focuses} {f.focuses === 1 ? 'focus' : 'focuses'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
} as const;

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: keyof typeof COLOR_MAP;
}) {
  return (
    <Card className="border border-gray-200 bg-white">
      <CardContent className="p-4">
        <div
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md mb-2 ${COLOR_MAP[color]}`}
        >
          {icon}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}

function RateCard({
  label,
  rate,
  subtitle,
}: {
  label: string;
  rate: number;
  subtitle: string;
}) {
  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="text-2xl font-bold text-gray-900">{rate}%</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DailyChart({ daily }: { daily: Array<{ date: string; views: number; submits: number }> }) {
  const max = Math.max(1, ...daily.map((d) => d.views));
  return (
    <div className="flex items-end gap-1 h-32">
      {daily.map((d) => {
        const viewH = (d.views / max) * 100;
        const subH = (d.submits / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col-reverse gap-0.5 group relative"
            title={`${d.date} • ${d.views} views • ${d.submits} submits`}
          >
            <div
              className="w-full bg-blue-200 rounded-sm transition-all"
              style={{ height: `${viewH}%`, minHeight: d.views > 0 ? '2px' : '0' }}
            />
            <div
              className="w-full bg-green-500 rounded-sm absolute bottom-0 transition-all"
              style={{ height: `${subH}%`, minHeight: d.submits > 0 ? '2px' : '0' }}
            />
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
