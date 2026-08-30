import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBioPageByUsername, incrementBioPageView } from '@/lib/storage/bio-links';
import { PublicBioClient } from './client';

export const dynamic = 'force-dynamic';

interface PublicBioPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: PublicBioPageProps): Promise<Metadata> {
  const params = await props.params;
  const page = await getBioPageByUsername(params.username);

  if (!page) {
    return {
      title: 'Profile Not Found | KlikBio',
    };
  }

  const title = `${page.title || page.username} | KlikBio`;
  const description = page.bio || `View links, social media, and forms for @${page.username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      username: page.username,
      images: page.avatarUrl ? [{ url: page.avatarUrl }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: page.avatarUrl ? [page.avatarUrl] : undefined,
    },
  };
}

export default async function PublicBioPage(props: PublicBioPageProps) {
  const params = await props.params;
  const page = await getBioPageByUsername(params.username);

  if (!page || !page.isActive) {
    notFound();
  }

  // Increment page view count in background (fire-and-forget)
  incrementBioPageView(page.id).catch(() => {});

  return <PublicBioClient page={page} />;
}
