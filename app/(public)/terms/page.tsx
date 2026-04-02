import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions | KlikForm',
    description: 'Terms and conditions for using the KlikForm platform.',
};

export default function TermsPage() {
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
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Terms & Conditions</h1>
                    </div>
                    <p className="text-gray-500 text-lg">
                        Please read these terms and conditions carefully before using our service.
                    </p>
                    <div className="mt-6 flex items-center text-sm text-gray-400">
                        Last updated: 20 February 2026
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 max-w-4xl mt-12">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Welcome to <strong className="font-semibold text-gray-900">KlikForm</strong> ("Service"). By accessing and using our service, you agree to comply with and be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these terms, you may not access the Service.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Description of Service</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        KlikForm is a form builder and data management platform that allows users to create forms, collect data, and integrate with third-party services such as Google Sheets and Google Drive.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Account Registration</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        You are solely responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Acceptable Use</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">You agree not to use the Service:</p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>For any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</li>
                        <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.</li>
                        <li>To submit false or misleading information.</li>
                        <li>To upload or transmit viruses or any other type of malicious code.</li>
                        <li>To collect or track the personal information of others without their consent ("phishing").</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Third-Party Services</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Our Service may contain links to third-party web sites or services that are not owned or controlled by KlikForm. KlikForm has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third-party web sites or services. You further acknowledge and agree that KlikForm shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such third-party services.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Respondent Data and Information Security</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Users are solely responsible for all forms, information, data, text, and other content uploaded or displayed through the Service.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        The use of our Service is also governed by our <strong className="font-semibold text-gray-900">Privacy Policy</strong>. As a user collecting data, you must comply with applicable data privacy laws (such as the Personal Data Protection Act 2010 in Malaysia) when processing your respondents' information.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Subscriptions and Payments</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Some parts of the Service are billed on a subscription basis. If you subscribe to a paid plan, you agree to pay all applicable fees according to the payment terms specified during purchase. KlikForm reserves the right to change its pricing at any time by providing reasonable preliminary notice.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Limitation of Liability</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        In no event shall KlikForm, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Changes to Terms</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Contact Us</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:support@klikform.com" className="text-primary hover:underline font-medium">support@klikform.com</a>.
                    </p>

                </div>
            </div>
        </div>
    );
}
