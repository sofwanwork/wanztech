import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | KlikForm',
    description: 'Learn how KlikForm manages and protects your data and privacy.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 relative pb-24">
            <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />

            {/* Header / Hero Section */}
            <div className="relative z-10 bg-white border-b border-slate-200 pt-16 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-violet-900">
                            <LockKeyhole className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-600 text-lg">
                        Learn how we maintain transparency and protect your personal information at KlikForm.
                    </p>
                    <div className="mt-6 flex items-center text-sm text-slate-500">
                        Last updated: 20 February 2026
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-4xl mt-12">
                <div className="bg-white rounded-lg p-8 md:p-12 shadow-2xs border border-slate-200">

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Welcome to <strong className="font-semibold text-gray-900">KlikForm</strong> ("we" or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, protect, and disclose your personal information when you use our website and services (collectively referred to as the "Service").
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        By accessing or using our Service, you agree to the information collection and use practices as outlined in this policy.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Information We Collect</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        We may collect personal information that you voluntarily provide when you register, express interest in our products, or contact us:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Account Information:</strong> Name, email address, username, and password.</li>
                        <li><strong className="font-semibold text-gray-900">Transaction Data:</strong> Data necessary to process your payment if you purchase a subscription plan.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Google User Data</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Our application integrates with <strong className="font-semibold text-gray-900">Google Drive</strong> and <strong className="font-semibold text-gray-900">Google Sheets API</strong> to provide robust automation functionalities. If you consent to connect your Google account, we access the following data:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Google Drive Files:</strong> We may access specific authorized folders or create new folders/files for the purpose of uploading your users' document images.</li>
                        <li><strong className="font-semibold text-gray-900">Google Sheets:</strong> We may read, create, and update spreadsheet files to synchronize form respondent data to the cloud.</li>
                    </ul>
                    <p className="text-gray-600 leading-relaxed mb-2">
                        <strong className="font-semibold text-gray-900">Limited Use Disclosure:</strong>
                    </p>
                    <p className="text-slate-600 leading-relaxed mb-6 bg-slate-50 border border-slate-200 p-4 rounded-md">
                        KlikForm's use and transfer to any other app of information received from Google APIs will adhere to the
                        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-violet-900 hover:underline font-medium ml-1">
                            Google API Services User Data Policy
                        </a>, including the Limited Use requirements.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. How We Use Your Information</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        The information we collect is used for the following business purposes:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Facilitating account creation and managing automation settings.</li>
                        <li>Processing payment transactions and billing management.</li>
                        <li>Protecting our Services (preventing misconduct and fraud).</li>
                        <li>Sending important system announcements, technical updates, and security notices to users.</li>
                        <li>Analyzing usage patterns and interactions to improve the stability of our services over time.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Cookies and Tracking</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        We use "cookies" on our application (primarily for login authentication/session management). However, if your browser's privacy settings block cookies, it may prevent navigation within your form builder dashboard.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Sharing and Disclosure</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        We may share your data in mandatory situations such as:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Legal Compliance:</strong> If required by formal judicial processes to combat fraud and maintain public safety in accordance with digital criminal procedural laws.</li>
                        <li><strong className="font-semibold text-gray-900">Business Transfers:</strong> During the process of a corporate merger, acquisition, or sale of the company.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Data Security Management</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        User information is stored and protected through elevated technical administrative practices to thwart unauthorized access. Please note that while we implement SSL and encryption initiatives, no internet infrastructure is 100% guaranteed to be absolutely secure against breaches.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Your Data Management Rights</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        You have full administrative capabilities and the perpetual right to delete or modify any data privacy settings or export system logs within minutes from your "System Profile". If you still require internal administrative assistance, please submit a request immediately via the main page.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Contact Us</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        If you have any questions, concerns, or complaints regarding this privacy policy, please contact us at <a href="mailto:support@klikform.com" className="text-violet-900 hover:underline font-medium">support@klikform.com</a>.
                    </p>

                </div>
            </div>
        </div>
    );
}
