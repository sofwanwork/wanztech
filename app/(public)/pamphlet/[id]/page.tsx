import { redirect } from 'next/navigation';
import { getPamphletPublic } from '@/lib/storage/pamphlets';

interface PamphletIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function PamphletIdPage(props: PamphletIdPageProps) {
  const params = await props.params;

  if (params.id === 'demo') {
    redirect('/p/demo');
  }

  const pamphlet = await getPamphletPublic(params.id);

  if (pamphlet?.slug) {
    redirect(`/p/${pamphlet.slug}`);
  }

  redirect('/p/' + params.id);
}
