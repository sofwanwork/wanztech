import { Metadata } from 'next';
import { Suspense } from 'react';
import { getQRCodes } from '@/lib/storage/qr-codes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, QrCode } from 'lucide-react';
import { QrCodeList } from './qr-code-list';
import { DashboardSearch } from '@/components/dashboard/search';
import { DashboardFilter } from '@/components/dashboard/filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'QR Builder | KlikForm',
    description: 'Manage and create custom QR codes',
};

interface QrBuilderPageProps {
    searchParams?: Promise<{
        q?: string;
        sort?: string;
    }>;
}

export default async function QrBuilderPage({ searchParams }: QrBuilderPageProps) {
    const params = await searchParams;
    const query = params?.q || '';
    const sort = params?.sort || 'newest';

    const qrCodes = await getQRCodes(query, sort);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Simple Stats Placeholder - specific to QR Codes */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qrCodes.length}</div>
                        <p className="text-xs text-muted-foreground">
                            active codes
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">QR Builder</h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                        Create and manage custom QR codes for your links.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:block">
                        <DashboardSearch />
                    </div>
                    <DashboardFilter />
                    <div className="md:hidden">
                        <Button variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                    <Link href="/qr-builder/new">
                        <Button className="ml-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="md:hidden">
                <DashboardSearch />
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <QrCodeList initialQrCodes={qrCodes} query={query} />
            </Suspense>
        </div>
    );
}
