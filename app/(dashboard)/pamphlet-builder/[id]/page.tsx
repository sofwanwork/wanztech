import { notFound } from 'next/navigation';
import { getPamphletById } from '@/lib/storage/pamphlets';
import { PamphletBuilderClient } from './client';

interface PamphletBuilderPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Penyunting E-Pamphlet & Buku Program | KlikForm',
  description: 'Urus helaian muka surat, tetapkan mod paparan 3D Flipbook, dan pautan majlis.',
};

export default async function PamphletBuilderPage(
  props: PamphletBuilderPageProps
) {
  const params = await props.params;
  const pamphlet = await getPamphletById(params.id);

  if (!pamphlet) {
    notFound();
  }

  return <PamphletBuilderClient initialPamphlet={pamphlet} />;
}
