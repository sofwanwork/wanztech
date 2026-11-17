'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
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
        'relative flex flex-col bg-white rounded-lg p-6 sm:p-7 lg:p-8 transition-colors justify-between',
        plan.popular
          ? 'border-2 border-violet-900 shadow-sm'
          : 'border border-slate-200 shadow-2xs hover:border-slate-300'
      )}
    >
      {/* Top Floating Badge for Popular / Coming Soon */}
      {plan.popular && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-violet-900 text-white text-[10px] font-mono font-semibold tracking-wider uppercase shadow-xs">
            Recommended
          </span>
        </div>
      )}

      {plan.comingSoon && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-semibold tracking-wider uppercase">
            Coming Soon
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
            {plan.icon}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">{plan.name}</h3>
        <p className="text-xs text-slate-500 mb-5 font-normal leading-relaxed min-h-[36px]">
          {plan.description}
        </p>

        {/* Price display */}
        <div className="pb-5 mb-5 border-b border-slate-100">
          {plan.name === 'Enterprise' ? (
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">Custom</div>
              <p className="text-xs text-slate-500 mt-1">For universities, government &amp; enterprises</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                <span className="text-xs font-mono text-slate-500">{plan.period}</span>
              </div>

              {plan.name === 'Pro' ? (
                <div className="space-y-0.5 text-xs font-mono">
                  <p className="text-slate-900 font-semibold">RM 15 / month • Full unlimited access</p>
                  <p className="text-slate-400 text-[11px]">Cancel anytime • No hidden charges</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono">No credit card required • Free forever</p>
              )}
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mb-7">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            {plan.name === 'Enterprise' ? 'Capabilities:' : 'Included:'}
          </p>

          <ul className="space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className={cn(
                  "h-4 w-4 rounded flex items-center justify-center shrink-0 mt-0.5",
                  plan.popular ? "bg-violet-50 text-violet-900" : "bg-slate-100 text-slate-900"
                )}>
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}

            {plan.notIncluded.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-xs text-slate-400">
                <span className="h-4 w-4 rounded bg-slate-50 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-2.5 w-2.5 stroke-[2]" />
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
            className="w-full h-10 rounded-md text-xs font-medium border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
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
              'w-full h-10 rounded-md text-xs font-medium transition-colors group',
              plan.popular
                ? 'bg-violet-900 text-white hover:bg-violet-950 shadow-xs'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            )}
            variant={plan.popular ? 'default' : 'outline'}
            disabled={isDisabled}
            onClick={handleUpgrade}
          >
            {loading && plan.name === 'Pro' ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>{buttonText}</span>
                {!isDisabled && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
