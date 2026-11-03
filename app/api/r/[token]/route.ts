import { getForm, getLink, saveResponse } from '@/lib/db';
import { TOKEN, formIdFor } from '@/lib/forms';
import { missingRequired, sanitize } from '@/lib/schema';

const MAX_BODY = 200_000;

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { token } = await params;
  const link = TOKEN.test(token) ? await getLink(token) : undefined;
  if (!link) return Response.json({ error: 'Link inválido.' }, { status: 404 });
  if (link.submitted_at) return Response.json({ error: 'Este link já foi respondido.' }, { status: 409 });

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) {
    return Response.json({ error: 'Resposta grande demais.' }, { status: 413 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: 'Requisição inválida.' }, { status: 400 });

  const formId = await formIdFor(link);
  const form = await getForm(formId);
  const answers = sanitize(form, (body as { answers?: unknown }).answers);
  const missing = missingRequired(form, answers);
  if (missing.length) return Response.json({ error: 'Faltam respostas obrigatórias.', missing }, { status: 422 });

  if (!(await saveResponse(token, formId, answers))) {
    return Response.json({ error: 'Este link já foi respondido.' }, { status: 409 });
  }
  return Response.json({ ok: true });
}
