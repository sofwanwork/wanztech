'use client';

import { QRCode } from '@/lib/types/qr-codes';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { deleteQRCodeAction } from '@/actions/qr-codes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QrCodeListProps {
  initialQrCodes: QRCode[];
  query?: string;
}

export function QrCodeList({ initialQrCodes, query }: QrCodeListProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    const res = await deleteQRCodeAction(id);
    if (res.success) {
      toast.success('QR Code deleted');
      router.refresh(); // Refresh server component
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  if (initialQrCodes.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        {query ? (
          <>
            <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
              <QrCode className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No matches found</h3>
            <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
              No QR codes found matching &quot;{query}&quot;. Try a different keyword.
            </p>
            <Link href="/qr-builder" prefetch={false}>
              <Button variant="outline">Clear Search</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <QrCode className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No QR Codes Yet</h3>
            <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
              Create your first custom QR code now. It only takes a few seconds.
            </p>
            <Link href="/qr-builder/new">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30"
              >
                Create QR Code
              </Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {initialQrCodes.map((qr) => (
        <Card key={qr.id} className="group hover:border-primary/50 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="truncate">{qr.title}</CardTitle>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-gray-50 rounded-md mx-6 mb-4 relative overflow-hidden">
            {/* We could render a mini preview here, but for now just an icon */}
            <QrCode className="h-16 w-16 text-gray-400 group-hover:text-primary transition-colors" />
            <p className="absolute bottom-2 text-xs text-muted-foreground truncate max-w-[80%]">
              {qr.content}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href={`/qr-builder/${qr.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" size="icon" onClick={() => handleDelete(qr.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
