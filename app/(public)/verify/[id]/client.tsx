'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VerifyClientProps {
  certificateId: string;
  formData: {
    id: string;
    title: string;
    templateId?: string;
  } | null;
}

export function VerifyClient({ certificateId, formData }: VerifyClientProps) {
  // If form data found, redirect to IC check
  if (formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{formData.title}</h1>
            <p className="text-gray-600 mt-2">Certificate Verification</p>
          </div>

          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Program Certificate Found
              </h3>
              <p className="text-blue-600 mb-4">
                Please verify your certificate by entering your IC number
              </p>
              <Link href={`/check/${formData.id}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Award className="mr-2 h-4 w-4" />
                  Verify My Certificate
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Certificate not found
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Award className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-600 mt-2">Verify your e-certificate authenticity</p>
        </div>

        <Card className="border-0 shadow-lg bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Certificate Not Found</h3>
            <p className="text-red-600 mb-4">
              No certificate found with ID:{' '}
              <code className="bg-red-100 px-2 py-1 rounded text-sm">{certificateId}</code>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Please make sure you&apos;re using the correct verification link or contact the
              certificate issuer.
            </p>
            <Link href="/">
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
