'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingModalProps {
  children: React.ReactNode;
}

const plans = [
  {
    name: 'Free',
    price: 'RM 0',
    period: '/ forever',
    description: 'Perfect for getting started',
    icon: Users,
    color: 'bg-slate-100 text-slate-700',
    features: [
      '5 forms per month',
      '3,000 responses per form',
      'Basic form fields',
      'Google Sheets integration',
      'QR code generation',
    ],
    notIncluded: ['Unlimited forms', 'Unlimited responses', 'Priority support', 'Custom branding'],
    current: true,
  },
  {
    name: 'Pro',
    price: 'RM 29',
    period: '/ month',
    description: 'For professionals and growing teams',
    icon: Crown,
    color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800',
    features: [
      'Unlimited forms',
      'Unlimited responses',
      'All form field types',
      'Google Sheets integration',
      'QR code generation',
      'E-Certificate generation',
      'Priority support',
      'Remove KlikForm branding',
    ],
    notIncluded: [],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    period: '',
    description: 'For large organizations',
    icon: Zap,
    color: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800',
    features: [
      'Everything in Pro',
      'Team management',
      'Custom domain',
      'API access',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    notIncluded: [],
    comingSoon: true,
  },
];

export function PricingModal({ children }: PricingModalProps) {
  const [open, setOpen] = useState(false);

  const handleUpgrade = (plan: string) => {
    if (plan === 'Pro') {
      // Open WhatsApp for manual upgrade
      const message = encodeURIComponent('Hi, saya nak upgrade ke Pro Plan klikform.');
      window.open(`https://wa.me/601133114369?text=${message}`, '_blank');
    } else if (plan === 'Enterprise') {
      const message = encodeURIComponent(
        'Hi, I am interested in KlikForm Enterprise plan. Please contact me for details.'
      );
      window.open(`https://wa.me/601133114369?text=${message}`, '_blank');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={cn(
                  'relative border-2 transition-all hover:shadow-lg',
                  plan.popular && 'border-primary shadow-lg scale-105',
                  plan.current && 'border-slate-300'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Coming Soon
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div
                    className={cn(
                      'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2',
                      plan.color
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                        <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={plan.current || plan.comingSoon}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {plan.current
                      ? 'Current Plan'
                      : plan.comingSoon
                        ? 'Coming Soon'
                        : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Need help choosing? Contact us at{' '}
          <a href="mailto:wanztechenterprise@gmail.com" className="text-primary hover:underline">
            wanztechenterprise@gmail.com
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
