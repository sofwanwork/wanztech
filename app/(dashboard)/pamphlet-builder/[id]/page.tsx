import { notFound } from 'next/navigation';
import { getPamphletById } from '@/lib/storage/pamphlets';
import { PamphletBuilderClient } from './client';

interface PamphletBuilderPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'E-Pamphlet & Program Book Builder | KlikForm',
  description: 'Manage brochure pages, set 3D Flipbook display mode, and configure event action links.',
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
