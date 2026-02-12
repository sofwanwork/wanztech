import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PlanCard } from '@/components/pricing/plan-card';

export default async function PricingPage() {
    // Check auth status for header button
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
    const { data: { user } } = await supabase.auth.getUser();

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
                'QR code generation',
            ],
            notIncluded: [
                'Unlimited forms',
                'Unlimited responses',
                'Priority support',
                'Remove KlikForm branding',
            ],
            current: currentTier === 'Free',
        },
        {
            name: 'Pro',
            price: 'RM 10',
            period: '/ month',
            periodDetail: 'for first 3 months',
            priceDetail: 'then RM 19 / month',
            description: 'For professionals and growing teams',
            icon: <Crown className="h-6 w-6" />,
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
                        <span><span className="text-primary">Klik</span>Form</span>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <Link href="/#features" className="hover:text-primary transition-colors">Ciri-ciri</Link>
                        <Link href="/pricing" className="text-primary font-semibold transition-colors">Harga</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={user ? "/forms" : "/login"}>
                                {user ? "Dashboard" : "Log Masuk"}
                            </Link>
                        </Button>
                        {!user && (
                            <Button size="sm" asChild>
                                <Link href="/login?tab=signup">
                                    Daftar Percuma
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
                            Pelan Harga Mudah & Telus
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            Pilih pelan yang sesuai untuk keperluan anda. Tiada caj tersembunyi.
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
