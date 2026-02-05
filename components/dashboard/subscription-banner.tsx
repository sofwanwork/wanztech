'use client';

import { AlertTriangle, Clock, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingModal } from '@/components/pricing-modal';

interface SubscriptionBannerProps {
    status: 'active' | 'grace_period' | 'expired' | 'free';
    daysRemaining?: number;
    graceDaysRemaining?: number;
}

export function SubscriptionBanner({ status, daysRemaining, graceDaysRemaining }: SubscriptionBannerProps) {
    // Don't show banner for active or free users
    if (status === 'active' || status === 'free') {
        return null;
    }

    // Grace period warning (yellow/amber)
    if (status === 'grace_period') {
        return (
            <div className="bg-amber-50 border-b border-amber-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">
                                Langganan Pro anda telah tamat!
                            </p>
                            <p className="text-sm text-amber-700">
                                Anda mempunyai <strong>{graceDaysRemaining} hari</strong> lagi sebelum akaun disekat sepenuhnya.
                            </p>
                        </div>
                    </div>
                    <PricingModal>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shrink-0">
                            <CreditCard className="h-4 w-4" />
                            Renew Sekarang
                        </Button>
                    </PricingModal>
                </div>
            </div>
        );
    }

    // Expired/blocked (red)
    if (status === 'expired') {
        return (
            <div className="bg-red-50 border-b border-red-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-800">
                                Akaun anda telah disekat!
                            </p>
                            <p className="text-sm text-red-700">
                                Langganan Pro anda telah tamat. Sila renew untuk terus menggunakan KlikForm.
                            </p>
                        </div>
                    </div>
                    <PricingModal>
                        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
                            <CreditCard className="h-4 w-4" />
                            Renew dan Unlock
                        </Button>
                    </PricingModal>
                </div>
            </div>
        );
    }

    return null;
}
