import { getLink } from '@/lib/db';
import { asciiSlug, markdownOf, markdownResponse } from '@/lib/forms';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getLink(token);
  const md = link && (await markdownOf(link));
  if (!link || !md) return Response.json({ error: 'Sem resposta.' }, { status: 404 });
  return markdownResponse(md, `fratelli-${asciiSlug(link.label)}`);
}
