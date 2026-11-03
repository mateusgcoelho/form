import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { serve } from '@hono/node-server';
import {
  createLink, deleteLink, getAnswers, getForm, getLink, latestFormId, listLinks, saveResponse,
} from './db.ts';
import type { LinkRow } from './db.ts';
import { toMarkdown } from './markdown.ts';
import { missingRequired, sanitize } from './schema.ts';

const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error('Defina ADMIN_PASSWORD (copie .env.example para .env).');
  process.exit(1);
}

const page = (name: string) => readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8');
const TOKEN = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_BODY = 200_000;

// Link pendente sempre mostra a versão mais recente das perguntas; link respondido fica
// preso à versão que foi respondida, para o .md continuar fiel.
const formIdFor = (link: LinkRow) => (link.submitted_at ? link.form_id : latestFormId());

const app = new Hono();

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('X-Robots-Tag', 'noindex, nofollow');
});

/* ---------- público: formulário por link ---------- */

app.get('/', (c) => c.text('Fratelli: use o link que você recebeu.', 404));

app.get('/r/:token', (c) => {
  const token = c.req.param('token');
  const link = TOKEN.test(token) ? getLink(token) : undefined;
  if (!link) return c.text('Link inválido ou removido.', 404);

  const boot = JSON.stringify({
    token,
    submitted: link.submitted_at !== null,
    form: getForm(formIdFor(link)),
  }).replace(/</g, '\\u003c');
  return c.html(page('form.html').replace('__BOOT__', () => boot));
});

app.post('/api/r/:token', async (c) => {
  const token = c.req.param('token');
  const link = TOKEN.test(token) ? getLink(token) : undefined;
  if (!link) return c.json({ error: 'Link inválido.' }, 404);
  if (link.submitted_at) return c.json({ error: 'Este link já foi respondido.' }, 409);

  if (Number(c.req.header('content-length') ?? 0) > MAX_BODY) return c.json({ error: 'Resposta grande demais.' }, 413);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Requisição inválida.' }, 400);

  const formId = formIdFor(link);
  const form = getForm(formId);
  const answers = sanitize(form, (body as { answers?: unknown }).answers);
  const missing = missingRequired(form, answers);
  if (missing.length) return c.json({ error: 'Faltam respostas obrigatórias.', missing }, 422);

  if (!saveResponse(token, formId, answers)) return c.json({ error: 'Este link já foi respondido.' }, 409);
  return c.json({ ok: true });
});

/* ---------- backoffice (Basic Auth) ---------- */

const auth = basicAuth({ username: process.env.ADMIN_USER ?? 'admin', password });
app.use('/admin', auth);
app.use('/admin/*', auth);
app.use('/api/admin/*', auth);

app.get('/admin', (c) => c.html(page('admin.html')));

const asciiSlug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resposta';

const mdOf = (link: LinkRow): string | undefined => {
  const answers = getAnswers(link.token);
  if (!answers) return undefined;
  return toMarkdown(getForm(link.form_id), answers, {
    label: link.label, createdAt: link.created_at, submittedAt: link.submitted_at,
  });
};

const markdown = (c: { body: (d: string, i: ResponseInit) => Response }, md: string, filename: string) =>
  c.body(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.md"`,
    },
  });

app.get('/api/admin/links', (c) => c.json(listLinks()));

app.post('/api/admin/links', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { label?: unknown };
  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : '';
  if (!label) return c.json({ error: 'Dê um nome ao link.' }, 400);
  return c.json(createLink(label), 201);
});

app.delete('/api/admin/links/:token', (c) =>
  deleteLink(c.req.param('token')) ? c.json({ ok: true }) : c.json({ error: 'Não encontrado.' }, 404),
);

app.get('/api/admin/links/:token/response', (c) => {
  const link = getLink(c.req.param('token'));
  const md = link && mdOf(link);
  return md ? c.json({ md }) : c.json({ error: 'Sem resposta.' }, 404);
});

app.get('/api/admin/links/:token/response.md', (c) => {
  const link = getLink(c.req.param('token'));
  const md = link && mdOf(link);
  return link && md ? markdown(c, md, `fratelli-${asciiSlug(link.label)}`) : c.json({ error: 'Sem resposta.' }, 404);
});

app.get('/api/admin/export.md', (c) => {
  const parts = listLinks()
    .filter((l) => l.submitted_at)
    .sort((a, b) => a.submitted_at!.localeCompare(b.submitted_at!))
    .map(mdOf)
    .filter((m): m is string => !!m);
  if (!parts.length) return c.json({ error: 'Nenhuma resposta ainda.' }, 404);
  return markdown(c, parts.join('\n---\n\n'), 'fratelli-todas-as-respostas');
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Formulário/backoffice em http://localhost:${port}/admin`);
});
