import { flatten, isEmpty } from './schema.ts';
import type { Answers, FormSchema, Leaf } from './schema.ts';

const DASH = 'Sem resposta';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });

const arr = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);

function render(f: Leaf, a: Answers): string {
  const v = a[f.name];
  switch (f.type) {
    case 'text':
    case 'select':
      return isEmpty(v) ? DASH : String(v);
    case 'area':
      // preserva quebras de linha dentro de um bloco de citação
      return isEmpty(v) ? DASH : String(v).split('\n').map((l) => `> ${l}`).join('\n');
    case 'scale':
      return isEmpty(v) ? DASH : `${v}/${f.max}`;
    case 'chips':
      return arr(v).length ? arr(v).map((x) => `- ${x}`).join('\n') : DASH;
    case 'cards': {
      const title = (id: string) => f.options.find((o) => o.v === id)?.t ?? id;
      const picked = arr(v);
      let out = picked.length ? picked.map((x) => `- ${title(x)}`).join('\n') : DASH;
      if (f.rank) {
        const top = arr(a[f.rank.name]);
        out += `\n\n**${f.rank.label}**\n\n` + (top.length ? top.map((x, i) => `${i + 1}. ${title(x)}`).join('\n') : DASH);
      }
      return out;
    }
  }
}

export function toMarkdown(
  form: FormSchema,
  answers: Answers,
  meta: { label: string; createdAt: string; submittedAt: string | null },
): string {
  const lines = [
    `# Diagnóstico ${form.brand}`,
    '',
    `- **Link:** ${meta.label}`,
    `- **Enviado em:** ${meta.submittedAt ? fmtDate(meta.submittedAt) : DASH}`,
    '',
  ];
  for (const step of form.steps) {
    lines.push(`## ${step.title}`, '');
    for (const f of flatten(step.fields)) {
      lines.push(`**${f.label}**`, '', render(f, answers), '');
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
