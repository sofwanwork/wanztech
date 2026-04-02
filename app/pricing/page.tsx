import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Users } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PlanCard } from '@/components/pricing/plan-card';
import { LandingMobileMenu } from '@/components/landing-mobile-menu';
import { LandingNavbar } from '@/components/landing-navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans | KlikForm',
  description: 'Choose the right KlikForm plan for your needs. Start for free or upgrade to Pro for unlimited features.',
  alternates: {
    canonical: 'https://klikform.com/pricing',
  }
};

export default async function PricingPage() {
  // Check auth status for header button
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentTier = 'Free';

  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      currentTier = subscription.tier === 'pro' ? 'Pro' : 'Free';
    }
  }

  const plans = [
    {
      name: 'Free',
      price: 'RM 0',
      period: '/ forever',
      description: 'Perfect for getting started',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-slate-100 text-slate-700',
      features: [
        '5 forms limit',
        '3,000 responses / month',
        'Basic form fields',
        'Google Sheets integration',
        'Basic QR code generation',
        'URL Shortener',
        '5 Dynamic QR code generation',
        '2 E-Certificate generation',
        'Certificate Verification System',
      ],
      notIncluded: [
        'Unlimited forms',
        'Unlimited responses',
        'All form field types',
        'Priority support',
        'Remove KlikForm branding',
      ],
      current: currentTier === 'Free',
    },
    {
      name: 'Pro',
      price: 'RM 5',
      period: '/ month',
      periodDetail: 'for first 3 months (50% discount)',
      priceDetail: 'then RM 10 / month',
      description: 'For professionals and growing teams',
      icon: <Crown className="h-6 w-6" />,
      color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800',
      features: [
        'Unlimited forms',
        'Unlimited responses',
        'All form field types',
        'Google Sheets integration',
        'Dynamic QR code generator',
        'URL Shortener',
        'E-Certificate generation',
        'Certificate Verification System',
        'Priority support',
        'Remove KlikForm branding',
      ],
      notIncluded: [],
      popular: true,
      current: currentTier === 'Pro',
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      period: '',
      description: 'For large organizations',
      icon: <Zap className="h-6 w-6" />,
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="KlikForm Logo"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <span>
              <span className="text-primary">Klik</span>Form
            </span>
          </Link>
          <div className="hidden md:flex flex-1 justify-center ml-8">
            <LandingNavbar />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={user ? '/forms' : '/login'}>{user ? 'Dashboard' : 'Login'}</Link>
              </Button>
              {!user && (
                <Button size="sm" asChild>
                  <Link href="/login?tab=signup">Sign Up Free</Link>
                </Button>
              )}
            </div>
            <LandingMobileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
              Simple & Transparent Pricing
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Choose the right plan for your needs. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} user={user} />
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6 md:py-0">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center gap-4 md:h-24">
          <div className="flex items-center justify-center gap-2">
            <div className="relative h-6 w-6">
              <Image
                src="/logo.png"
                alt="KlikForm Logo"
                fill
                className="object-contain"
                sizes="24px"
              />
            </div>
            <p className="text-sm text-gray-500">© 2024 KlikForm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
