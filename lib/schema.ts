export type Option = { v: string; t: string; d: string };

type Base = { name: string; label: string; required?: boolean };

export type Leaf =
  | (Base & { type: 'text' | 'area'; placeholder?: string })
  | (Base & { type: 'select'; options: string[] })
  | (Base & { type: 'chips'; options: string[]; hint?: string; single?: boolean })
  | (Base & { type: 'scale'; min: number; max: number; low: string; high: string })
  | (Base & {
      type: 'cards';
      hint: string;
      options: Option[];
      rank?: { name: string; label: string; max: number };
    });

export type Field = Leaf | { type: 'pair'; fields: [Field, Field] };

export type Step = { key: string; title: string; sub: string; fields: Field[] };

export type FormSchema = {
  brand: string;
  heroTitle: string;
  heroLead: string;
  steps: Step[];
};

export type Answers = Record<string, string | string[]>;

export function flatten(fields: Field[]): Leaf[] {
  return fields.flatMap((f) => (f.type === 'pair' ? flatten(f.fields) : [f]));
}

export function leaves(form: FormSchema): Leaf[] {
  return form.steps.flatMap((s) => flatten(s.fields));
}

const MAX_TEXT = 4000;

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Mantém só o que o schema conhece e que seja válido; descarta o resto. */
export function sanitize(form: FormSchema, raw: unknown): Answers {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Answers = {};

  for (const f of leaves(form)) {
    const v = input[f.name];
    switch (f.type) {
      case 'text':
      case 'area':
        out[f.name] = typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '';
        break;
      case 'select':
        out[f.name] = typeof v === 'string' && f.options.includes(v) ? v : '';
        break;
      case 'scale': {
        const n = typeof v === 'string' ? Number(v) : NaN;
        out[f.name] = Number.isInteger(n) && n >= f.min && n <= f.max ? String(n) : '';
        break;
      }
      case 'chips': {
        const picked = [...new Set(asArray(v))].filter((x) => f.options.includes(x));
        out[f.name] = f.single ? picked.slice(0, 1) : picked;
        break;
      }
      case 'cards': {
        const valid = f.options.map((o) => o.v);
        const picked = [...new Set(asArray(v))].filter((x) => valid.includes(x));
        out[f.name] = picked;
        if (f.rank) {
          out[f.rank.name] = [...new Set(asArray(input[f.rank.name]))]
            .filter((x) => picked.includes(x))
            .slice(0, f.rank.max);
        }
        break;
      }
    }
  }
  return out;
}

export const isEmpty = (v: string | string[] | undefined): boolean =>
  v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim() === '');

/** Nomes dos campos obrigatórios que ficaram vazios. */
export function missingRequired(form: FormSchema, answers: Answers): string[] {
  return leaves(form)
    .filter((f) => f.required && isEmpty(answers[f.name]))
    .map((f) => f.name);
}
