import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="mb-8">
                <Link href="/">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent">
                        ← Back to Home
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div className="prose max-w-none space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Introduction</h2>
                    <p>
                        Welcome to KlikForm ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
                    <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Personal Information:</strong> Name, email address, passwords, and contact data.</li>
                        <li><strong>Payment Data:</strong> Data necessary to process your payment if you make purchases.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Google User Data</h2>
                    <p>
                        Our application integrates with Google Drive and Google Sheets APIs to provide enhanced functionality. If you choose to connect your Google account, we access the following data:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Google Drive Files:</strong> We may access specific folders you designate or create new folders/files to store form submissions.</li>
                        <li><strong>Google Sheets:</strong> We may read, create, and update Google Sheets to sync form submission data.</li>
                    </ul>
                    <p className="mt-2 font-medium">Limited Use Disclosure:</p>
                    <p>
                        KlikForm's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">4. How We Use Your Information</h2>
                    <p>We use personal information collected via our website for a variety of business purposes described below:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>To facilitate account creation and logon processes.</li>
                        <li>To send you marketing and promotional communications.</li>
                        <li>To fulfill and manage your orders.</li>
                        <li>To protect our Services (e.g., fraud monitoring and prevention).</li>
                        <li>To improve our Services (e.g., data analysis, identifying usage trends).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Disclosure of Your Information</h2>
                    <p>
                        We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                        <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Security of Your Information</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contact Us</h2>
                    <p>
                        If you have questions or comments about this policy, you may email us at <a href="mailto:support@klikform.com" className="text-blue-600 underline">support@klikform.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
