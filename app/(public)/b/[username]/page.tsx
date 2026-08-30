import { redirect } from 'next/navigation';

interface ShortBioPageProps {
  params: Promise<{ username: string }>;
}

export default async function ShortBioPage(props: ShortBioPageProps) {
  const params = await props.params;
  redirect(`/bio/${params.username}`);
}
