import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPamphletPublic } from '@/lib/storage/pamphlets';
import { getSamplePamphlet } from '@/lib/pamphlets/utils';
import { PamphletViewer } from '@/components/pamphlet/viewer';

export const dynamic = 'force-dynamic';

interface PublicPamphletPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: PublicPamphletPageProps
): Promise<Metadata> {
  const params = await props.params;

  if (params.slug === 'demo' || params.slug === 'demo-pamphlet') {
    const demo = getSamplePamphlet();
    return {
      title: `${demo.title} | E-Pamphlet KlikForm`,
      description: demo.description,
      openGraph: {
        title: demo.title,
        description: demo.description,
        images: demo.coverImage ? [{ url: demo.coverImage }] : undefined,
      },
    };
  }

  const pamphlet = await getPamphletPublic(params.slug);

  if (!pamphlet) {
    return {
      title: 'Program Book Not Found | KlikForm',
    };
  }

  const title = `${pamphlet.title} | Digital Program Book`;
  const description =
    pamphlet.description ||
    `View the official digital program book for ${pamphlet.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: pamphlet.coverImage ? [{ url: pamphlet.coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: pamphlet.coverImage ? [pamphlet.coverImage] : undefined,
    },
  };
}

export default async function PublicPamphletPage(
  props: PublicPamphletPageProps
) {
  const params = await props.params;

  // Support instant interactive demo
  if (params.slug === 'demo' || params.slug === 'demo-pamphlet') {
    const demo = getSamplePamphlet();
    return <PamphletViewer pamphlet={demo} />;
  }

  const pamphlet = await getPamphletPublic(params.slug);

  if (!pamphlet || !pamphlet.isActive) {
    notFound();
  }

  return <PamphletViewer pamphlet={pamphlet} />;
}
