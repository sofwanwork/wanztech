import { getQRCodeById } from '@/lib/storage/qr-codes';
import QrBuilderClient from '../client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQrCodePage({ params }: PageProps) {
  const { id } = await params;

  let initialData = null;

  if (id !== 'new') {
    initialData = await getQRCodeById(id);
    if (!initialData) {
      notFound();
    }
  }

  return (
    <div className="h-full">
      <QrBuilderClient initialData={initialData || undefined} />
    </div>
  );
}
