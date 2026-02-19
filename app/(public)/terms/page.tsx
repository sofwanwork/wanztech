import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="mb-8">
                <Link href="/">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent">
                        ← Back to Home
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div className="prose max-w-none space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using our services at KlikForm (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Description of Service</h2>
                    <p>
                        KlikForm is a form builder and data management platform that allows users to create forms, collect data, and integrate with third-party services like Google Sheets and Google Drive.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">3. User Accounts</h2>
                    <p>
                        When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
                    </p>
                    <p className="mt-2">
                        You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
                    <p>You agree not to use the Service:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>For any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</li>
                        <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.</li>
                        <li>To submit false or misleading information.</li>
                        <li>To upload or transmit viruses or any other type of malicious code.</li>
                        <li>To collect or track the personal information of others without consent ("phishing").</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Third-Party Services</h2>
                    <p>
                        Our Service may contain links to third-party web sites or services that are not owned or controlled by KlikForm.
                        KlikForm has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that KlikForm shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Termination</h2>
                    <p>
                        We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at <a href="mailto:support@klikform.com" className="text-blue-600 underline">support@klikform.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
