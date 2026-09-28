'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface PlanCardProps {
  plan: {
    name: string;
    price: string;
    period: string;
    periodDetail?: string;
    priceDetail?: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    features: string[];
    notIncluded: string[];
    popular?: boolean;
    comingSoon?: boolean;
    current?: boolean;
  };
  user: User | null;
}

export function PlanCard({ plan, user: initialUser }: PlanCardProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [planCurrent, setPlanCurrent] = useState(plan.current);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setPlanCurrent(plan.current);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch subscription status client-side
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier, status')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        const activeTier = subscription?.tier === 'pro' ? 'Pro' : 'Free';
        setPlanCurrent(plan.name === activeTier);
      }
    });
  }, [initialUser, plan]);

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = '/login?tab=signup&redirect=/pricing';
      return;
    }

    if (plan.name === 'Enterprise') {
      const message = encodeURIComponent(
        'Hi, I am interested in KlikForm Enterprise. Please contact me for more details.'
      );
      window.open(`https://wa.me/601133114369?text=${message}`, '_blank');
      return;
    }

    if (plan.name === 'Pro') {
      try {
        setLoading(true);
        const response = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'pro' }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('Payment initiation failed:', data);
          alert('Failed to initiate payment. Please try again in a moment.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const buttonText = plan.comingSoon
    ? 'Coming Soon'
    : user && planCurrent
      ? 'Current Plan'
      : plan.name === 'Pro'
        ? 'Upgrade to Pro'
        : 'Get Started Free';

  const isDisabled = plan.comingSoon || (planCurrent && !!user) || loading;

  return (
    <div
      className={cn(
        'relative flex flex-col bg-white rounded-3xl p-7 sm:p-8 lg:p-9 transition-all duration-300 justify-between',
        plan.popular
          ? 'border-2 border-purple-500 shadow-[0_16px_40px_rgba(147,51,234,0.08)] ring-4 ring-purple-500/5 md:-translate-y-2'
          : 'border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
      )}
    >
      {/* Top Floating Badge for Popular / Coming Soon */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold tracking-wider uppercase shadow-md">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Most Popular
          </span>
        </div>
      )}

      {plan.comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
            Coming Soon
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border', plan.color)}>
            {plan.icon}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{plan.name}</h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-normal leading-relaxed min-h-[36px]">
          {plan.description}
        </p>

        {/* Price display */}
        <div className="pb-6 mb-6 border-b border-slate-100">
          {plan.name === 'Enterprise' ? (
            <div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">Custom</div>
              <p className="text-xs text-slate-500 mt-1">Ideal for large institutions &amp; enterprises</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                <span className="text-sm font-medium text-slate-500">{plan.period}</span>
              </div>

              {plan.name === 'Pro' ? (
                <div className="space-y-0.5 text-xs">
                  <p className="text-emerald-600 font-semibold">RM 15 / month • Full unlimited access</p>
                  <p className="text-slate-400 text-[11px]">Cancel anytime • No hidden fees</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No credit card required • Free forever</p>
              )}
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {plan.name === 'Enterprise' ? 'Additional Benefits:' : 'Included Features:'}
          </p>

          <ul className="space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </span>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}

            {plan.notIncluded.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-400">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[2]" />
                </span>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        {plan.name === 'Free' ? (
          <Button
            size="lg"
            className="w-full h-12 rounded-xl text-sm font-semibold border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 transition-colors"
            variant="outline"
            disabled={isDisabled}
            asChild
          >
            <Link href={user ? '/forms' : '/login?tab=signup'}>
              {user ? 'Open Dashboard' : 'Get Started Free'}
            </Link>
          </Button>
        ) : (
          <Button
            size="lg"
            className={cn(
              'w-full h-12 rounded-xl text-sm font-semibold transition-all group',
              plan.popular
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            )}
            variant={plan.popular ? 'default' : 'outline'}
            disabled={isDisabled}
            onClick={handleUpgrade}
          >
            {loading && plan.name === 'Pro' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>{buttonText}</span>
                {!isDisabled && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
