import { getAnswers, getForm, latestFormId } from './db';
import type { LinkRow } from './db';
import { toMarkdown } from './markdown';

export const TOKEN = /^[A-Za-z0-9_-]{8,64}$/;

// Link pendente sempre mostra a versão mais recente das perguntas; link respondido fica
// preso à versão que foi respondida, para o .md continuar fiel.
export const formIdFor = async (link: LinkRow) => (link.submitted_at ? link.form_id : latestFormId());

export async function markdownOf(link: LinkRow): Promise<string | undefined> {
  const answers = await getAnswers(link.token);
  if (!answers) return undefined;
  return toMarkdown(await getForm(link.form_id), answers, {
    label: link.label,
    createdAt: link.created_at,
    submittedAt: link.submitted_at,
  });
}

export const asciiSlug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resposta';

export const markdownResponse = (md: string, filename: string) =>
  new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.md"`,
    },
  });
