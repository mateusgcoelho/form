import { deleteLink } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (await deleteLink(token))
    ? Response.json({ ok: true })
    : Response.json({ error: 'Não encontrado.' }, { status: 404 });
}
