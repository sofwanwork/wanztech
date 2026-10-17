import { Metadata } from 'next';
import { getSamplePamphlet } from '@/lib/pamphlets/utils';
import { PamphletViewer } from '@/components/pamphlet/viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '3D Flipbook Viewer — E-Pamphlet KlikForm',
  description:
    'Alami pengalaman membaca buku program digital & e-pamphlet 3D interaktif bertaraf antarabangsa di KlikForm dengan sentuhan seret-ke-selak (drag-to-flip) dan fizik realistik.',
  openGraph: {
    title: '3D Flipbook Viewer — E-Pamphlet KlikForm',
    description:
      'Alami pengalaman membaca buku program digital & e-pamphlet 3D interaktif bertaraf antarabangsa di KlikForm dengan sentuhan seret-ke-selak (drag-to-flip) dan fizik realistik.',
  },
};

export default function FlipbookShowcasePage() {
  const sample = getSamplePamphlet('showcase-3d-flipbook');
  return <PamphletViewer pamphlet={sample} />;
}
