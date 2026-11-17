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
      <div className="min-h-screen bg-white py-14 px-4 text-slate-900 font-sans relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
        <div className="max-w-md mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-slate-100 border border-slate-200 text-slate-800 mb-3 shadow-2xs">
              <Award className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug max-w-md mx-auto whitespace-pre-line break-words [text-wrap:balance]">
              {formData.title}
            </h1>
            <p className="text-slate-500 mt-1 text-xs font-mono uppercase tracking-wider">Official Certificate Registry</p>
          </div>

          <Card className="border border-slate-200 shadow-2xs bg-white rounded-lg">
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Program Certificate Registered
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Please verify your certificate by entering your identification number on the verification portal.
              </p>
              <div className="pt-2">
                <Link href={`/check/${formData.id}`}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md h-10 text-xs font-medium">
                    <Award className="mr-2 h-3.5 w-3.5" />
                    Verify My Certificate
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Certificate not found
  return (
    <div className="min-h-screen bg-white py-14 px-4 text-slate-900 font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-slate-100 border border-slate-200 text-slate-400 mb-3 shadow-2xs">
            <Award className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Certificate Verification</h1>
          <p className="text-slate-500 mt-1 text-xs font-mono">Verify e-certificate authenticity</p>
        </div>

        <Card className="border border-slate-200 shadow-2xs bg-white rounded-lg">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-rose-50 text-rose-600 border border-rose-200 mb-1">
              <XCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Certificate Not Found</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No active certificate record was found matching ID:{' '}
              <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">{certificateId}</code>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Please verify that you are using the exact verification link or contact the issuing organizer.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md h-10 text-xs font-medium">
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
