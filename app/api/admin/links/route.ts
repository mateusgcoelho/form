import { createLink, listLinks } from '@/lib/db';

export async function GET() {
  return Response.json(await listLinks());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { label?: unknown };
  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : '';
  if (!label) return Response.json({ error: 'Dê um nome ao link.' }, { status: 400 });
  return Response.json(await createLink(label), { status: 201 });
}
