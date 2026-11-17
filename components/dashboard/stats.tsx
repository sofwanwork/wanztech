'use client';

import { Subscription, Usage, TIER_LIMITS } from '@/lib/types';
import type { SubscriptionStatus } from '@/lib/storage/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Crown, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingModal } from '@/components/pricing-modal';

interface DashboardStatsProps {
  subscription: Subscription;
  usage: Usage;
  totalForms: number;
  subscriptionStatus?: SubscriptionStatus;
}

export function DashboardStats({ subscription, usage, totalForms, subscriptionStatus }: DashboardStatsProps) {
  // When subscription is expired or in grace period, use free-tier limits for display
  const isExpiredPro = subscriptionStatus === 'expired' || subscriptionStatus === 'grace_period';
  const effectiveTier = isExpiredPro ? 'free' : subscription.tier;
  const limits = TIER_LIMITS[effectiveTier];
  const isUnlimited = limits.maxForms === -1;
  const totalFormsProgress = isUnlimited ? 100 : (totalForms / limits.maxForms) * 100;
  const totalFormsRemaining = isUnlimited ? '∞' : limits.maxForms - totalForms;

  const tierColors = {
    free: 'bg-slate-100 text-slate-700 border-slate-200',
    pro: 'bg-violet-50 text-violet-900 border-violet-200/80',
    enterprise: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  };

  const tierIcons = {
    free: Users,
    pro: Crown,
    enterprise: Zap,
  };

  const TierIcon = tierIcons[subscription.tier];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Tier Badge Card */}
      <Card className="rounded-lg border border-slate-200 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
                tierColors[subscription.tier]
              )}
            >
              <TierIcon className="h-4 w-4" />
              <span className="capitalize">{subscription.tier}</span>
            </div>
          </div>
          {subscription.tier === 'free' && (
            <PricingModal>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-violet-900 hover:text-violet-950 text-xs font-medium"
                suppressHydrationWarning
              >
                Upgrade to Pro →
              </Button>
            </PricingModal>
          )}
        </CardContent>
      </Card>

      {/* Forms Created Card */}
      <Card className="rounded-lg border border-slate-200 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            New Forms (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{usage.formsCreated}</span>
          </div>
          <p className="text-xs text-gray-400">Forms created this month</p>
        </CardContent>
      </Card>

      {/* Total Forms Card */}
      <Card className="rounded-lg border border-slate-200 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Forms</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{totalForms}</span>
            <span className="text-sm text-gray-400 mb-1">
              / {isUnlimited ? '∞' : limits.maxForms}
            </span>
          </div>
          {!isUnlimited && (
            <div className="space-y-1">
              <Progress value={totalFormsProgress} className="h-1.5" />
              <p className="text-xs text-gray-400">{totalFormsRemaining} remaining</p>
            </div>
          )}
          {isUnlimited && <p className="text-xs text-green-600 font-medium">Unlimited forms</p>}
        </CardContent>
      </Card>

      {/* Submissions Card */}
      <Card className="rounded-lg border border-slate-200 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Responses This Month</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{usage.totalSubmissions}</span>
          </div>
          {subscription.tier === 'free' && (
            <p className="text-xs text-gray-400 mt-1">Limit: {limits.maxSubmissionsPerForm}/form</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
