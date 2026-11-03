import { notFound } from 'next/navigation';
import Wizard from '@/components/Wizard';
import { getForm, getLink } from '@/lib/db';
import { TOKEN, formIdFor } from '@/lib/forms';

// depende do banco e do estado do link: nunca pode vir de cache
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = TOKEN.test(token) ? await getLink(token) : undefined;
  if (!link) notFound();

  const form = await getForm(await formIdFor(link));
  return <Wizard token={token} form={form} alreadyAnswered={link.submitted_at !== null} />;
}
