'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
}

export function PlanCard({ plan, user }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      // Redirect to register (login tab=signup) if not logged in
      window.location.href = '/login?tab=signup&redirect=/pricing';
      return;
    }

    if (plan.name === 'Enterprise') {
      const message = encodeURIComponent(
        'Hi, I am interested in KlikForm Enterprise plan. Please contact me for details.'
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
          alert('Failed to initiate payment. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Determine button text and action
  const buttonText = plan.comingSoon
    ? 'Coming Soon'
    : user && plan.current
      ? 'Current Plan'
      : `Get Started with ${plan.name}`;

  const isDisabled = plan.comingSoon || (plan.current && !!user) || loading;

  return (
    <div
      className={cn(
        'relative flex flex-col bg-white rounded-2xl border transition-all hover:shadow-xl',
        plan.popular
          ? 'border-primary shadow-lg scale-105 z-10'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          Most Popular
        </div>
      )}
      {plan.comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          Coming Soon
        </div>
      )}

      <div className="p-8 border-b border-gray-100 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', plan.color)}>
            {plan.icon}
          </div>
          {plan.name === 'Pro' && (
            <div className="text-right">
              <span className="block text-xs text-gray-400 line-through">RM 19</span>
              <span className="block text-xs font-bold text-green-600">Promo!</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 font-medium">{plan.period}</span>
        </div>
        {plan.periodDetail && (
          <p className="text-xs text-green-600 font-medium mb-1">{plan.periodDetail}</p>
        )}
        {plan.priceDetail && <p className="text-xs text-gray-400">{plan.priceDetail}</p>}
      </div>

      <div className="p-8 bg-gray-50/50 rounded-b-2xl">
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
          {plan.notIncluded.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-gray-400">
              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* 
                    If user is logged out, clicking the button triggers handleUpgrade which redirects to /register.
                    If user is logged in, clicking the button triggers handleUpgrade which calls API.
                    
                    For Free plan, if user is logged out -> register. If logged in -> Go to dashboard or "Current Plan".
                */}
        {plan.name === 'Free' ? (
          <Button
            size="lg"
            className="w-full"
            variant={plan.popular ? 'default' : 'outline'}
            disabled={isDisabled}
            asChild
          >
            <Link href={user ? '/forms' : '/login?tab=signup'}>
              {user ? 'Go to Dashboard' : 'Get Started for Free'}
            </Link>
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
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
              buttonText
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
