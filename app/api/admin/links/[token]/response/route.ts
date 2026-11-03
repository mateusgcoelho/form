import { getLink } from '@/lib/db';
import { markdownOf } from '@/lib/forms';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getLink(token);
  const md = link && (await markdownOf(link));
  return md ? Response.json({ md }) : Response.json({ error: 'Sem resposta.' }, { status: 404 });
}
