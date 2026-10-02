import {
  getPamphlets,
  isPamphletsTableReady,
  PAMPHLETS_SQL_MIGRATION,
} from '@/lib/storage/pamphlets';
import { CreatePamphletDialog, PamphletCard, PamphletDatabaseNotice } from './client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, Sparkles, Layers, ExternalLink } from 'lucide-react';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'E-Pamphlet & Buku Program Digital | KlikForm',
  description:
    'Cipta dan edarkan buku program digital / brochure majlis dengan paparan 3D Flipbook interaktif dan Kod QR.',
};

export default async function PamphletsDashboard() {
  const [pamphlets, isTableReady] = await Promise.all([
    getPamphlets(),
    isPamphletsTableReady(),
  ]);

  // Get app URL for link previews
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  // Compute aggregate stats
  const totalPamphlets = pamphlets.length;
  const totalViews = pamphlets.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalPages = pamphlets.reduce(
    (acc, p) => acc + (Array.isArray(p.pages) ? p.pages.length : 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 md:px-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              E-Pamphlet & Buku Program
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> Baru
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Bina buku program digital majlis yang elegan dengan kesan 3D Flipbook, modul sentuhan, dan Kod QR sedia cetak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href="/p/demo" target="_blank">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>Lihat Demo Langsung</span>
            </Link>
          </Button>
          <CreatePamphletDialog />
        </div>
      </div>

      {/* Migration Notice if database table is not ready yet */}
      {!isTableReady && (
        <PamphletDatabaseNotice sqlScript={PAMPHLETS_SQL_MIGRATION} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jumlah Buku Program
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPamphlets}</div>
            <p className="text-xs text-muted-foreground mt-1">E-pamphlet dicipta</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jumlah Tontonan Hadirin
            </CardTitle>
            <Eye className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Imbasan & bacaan digital</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jumlah Muka Surat
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPages}</div>
            <p className="text-xs text-muted-foreground mt-1">Helaian aktif dipaparkan</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid or Empty State */}
      {pamphlets.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center bg-white/60 backdrop-blur-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-gray-900">
              Cipta Buku Program Digital Pertama Anda
            </h3>
            <p className="text-sm text-gray-500">
              Muat naik helaian brochure acara anda (PNG/JPG atau PDF), susun atur tentatif majlis, dan kongsi dengan kod QR yang anggun kepada hadirin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <CreatePamphletDialog buttonText="Mula Cipta E-Pamphlet" size="lg" />
            <Button asChild variant="outline" size="lg">
              <Link href="/p/demo" target="_blank" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Uji Pandu Contoh Buku Program</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Senarai E-Pamphlet Anda</h2>
            <span className="text-xs text-gray-500">{pamphlets.length} rekod</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pamphlets.map((p) => (
              <PamphletCard key={p.id} pamphlet={p} appUrl={appUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
