import Link from 'next/link';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy | KlikForm',
    description: 'Procedures and conditions regarding refunds at KlikForm.',
};

export default function RefundPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-24">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-100 pt-16 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <RefreshCcw className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Refund Policy</h1>
                    </div>
                    <p className="text-gray-500 text-lg">
                        Detailed terms regarding the eligibility and process for refunds and compensation.
                    </p>
                    <div className="mt-6 flex items-center text-sm text-gray-400">
                        Last updated: 20 February 2026
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 max-w-4xl mt-12">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">1. Basic Refund Policy</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        At <strong className="font-semibold text-gray-900">KlikForm</strong>, we ensure our online form builder service (SaaS) is consistently satisfactory. Because our service is a digitally accessible subscription product, <strong className="font-semibold text-gray-900">we generally do not offer arbitrary refunds once a subscription payment has been fully processed.</strong>
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        However, we will consider refund requests on a case-by-case basis for specific technical issues, subject to our discretion and specific eligibility criteria.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Eligibility for Refund Requests </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        You may be eligible for a full refund only if you meet the following conditions:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Critical System Issues:</strong> You find that the system is completely non-functional according to its official specifications within <strong className="font-semibold text-gray-900">three (3) days</strong> from the initial purchase date. This issue must be proven to originate from KlikForm's core system capabilities resulting in a 100% hard stop error with no alternative workarounds.</li>
                        <li><strong className="font-semibold text-gray-900">Duplicate Charges:</strong> Given instances of accidental duplicate subscription charges exceeding 2 transactions in the same month or cycle due to underlying payment gateway issues.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Non-Eligible Situations</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Refunds or compensation <strong className="font-semibold text-gray-900">WILL NOT BE PROVIDED</strong> in the following scenarios:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Buyer's remorse or spontaneous business alterations after the purchase.</li>
                        <li>Forgetting to cancel the subscription package before the monthly billing cycle / auto-renew activates for the next period. Users are highly encouraged to cancel their packages promptly via the system settings at the "Renew / Cancel" dashboard profile if they do not wish to be auto-charged next month.</li>
                        <li>Inability to provide a valid receipt as the primary transaction record with KlikForm.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Policy Claim Process</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        To submit a refund policy review with our support team:
                    </p>
                    <ol className="list-decimal pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Please formally email the case details to: <a href="mailto:support@klikform.com" className="text-primary hover:underline font-medium">support@klikform.com</a>.</li>
                        <li>Email Subject Title: "Refund Policy Review: [Your Email / Username]".</li>
                        <li>Include in the copy (screenshot of the original receipt or receipt confirmation number, along with a deep targeted description / justification of the disputed issue).</li>
                    </ol>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Duration and Method of Resolution</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Every complete complaint will be escalated to our operations supervisor for scrutiny. If the appeal review is approved, the compensation payment will be deposited back directly via the core card provider's mechanism or original payment channel at the earliest possible time, which may span a recurring cycle between 5 to 10 full working days (depending on the clearing speed of the international banking processor / channel account).
                    </p>

                </div>
            </div>
        </div>
    );
}
