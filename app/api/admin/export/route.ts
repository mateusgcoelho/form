import { listLinks } from '@/lib/db';
import { markdownOf, markdownResponse } from '@/lib/forms';

export async function GET() {
  const answered = (await listLinks())
    .filter((l) => l.submitted_at)
    .sort((a, b) => a.submitted_at!.localeCompare(b.submitted_at!));
  const parts = (await Promise.all(answered.map(markdownOf))).filter((m): m is string => !!m);
  if (!parts.length) return Response.json({ error: 'Nenhuma resposta ainda.' }, { status: 404 });
  return markdownResponse(parts.join('\n---\n\n'), 'fratelli-todas-as-respostas');
}
