import { Metadata } from 'next';
import { getSamplePamphlet } from '@/lib/pamphlets/utils';
import { PamphletViewer } from '@/components/pamphlet/viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '3D Flipbook Viewer — E-Pamphlet KlikForm',
  description:
    'Experience interactive 3D digital program books and e-pamphlets on KlikForm with realistic drag-to-flip physics.',
  openGraph: {
    title: '3D Flipbook Viewer — E-Pamphlet KlikForm',
    description:
      'Experience interactive 3D digital program books and e-pamphlets on KlikForm with realistic drag-to-flip physics.',
  },
};

export default function FlipbookShowcasePage() {
  const sample = getSamplePamphlet('showcase-3d-flipbook');
  return <PamphletViewer pamphlet={sample} />;
}
