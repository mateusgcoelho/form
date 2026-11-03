import type { Answers, Field } from '../server/schema.ts';
import { Check, ChevronDown, cx } from './ui.tsx';

export type Ctx = {
  answers: Answers;
  patch: (p: Answers) => void;
  invalid: string | null;
};

const arr = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : []);

const toggle = (a: string[], v: string, max?: number): string[] => {
  const i = a.indexOf(v);
  if (i > -1) return a.filter((x) => x !== v);
  return max && a.length >= max ? a : [...a, v];
};

const inputCls =
  'focus-ring block w-full rounded-field border border-transparent bg-input px-4 text-base transition duration-200 ease-out placeholder:text-muted-foreground/70 focus:border-primary/30 focus:bg-background aria-[invalid=true]:border-negative/50';

const pill = (on: boolean) =>
  on
    ? 'border-primary bg-primary text-primary-foreground'
    : 'border-border bg-background text-muted-foreground hover:border-foreground/25';

// Enunciado fixo no topo: ao rolar listas longas, a pergunta continua visível.
const STICKY = 'sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6';

const Req = () => <span className="text-accent" aria-hidden="true"> *</span>;

function Head({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div className={STICKY}>
      <p className="text-sm font-medium tracking-[-0.006em]">
        {label}
        {required && <Req />}
      </p>
      {hint && <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Label({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={name} className="mb-2 block text-sm font-medium tracking-[-0.006em]">
      {label}
      {required && <Req />}
    </label>
  );
}

export function FieldView({ f, ctx }: { f: Field; ctx: Ctx }) {
  const { answers, patch, invalid } = ctx;

  if (f.type === 'pair') {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {f.fields.map((x, i) => (
          <FieldView key={i} f={x} ctx={ctx} />
        ))}
      </div>
    );
  }

  const v = answers[f.name];
  const str = typeof v === 'string' ? v : '';
  const bad = invalid === f.name || undefined;

  switch (f.type) {
    case 'text':
      return (
        <div>
          <Label name={f.name} label={f.label} required={f.required} />
          <input id={f.name} name={f.name} type="text" placeholder={f.placeholder} value={str} aria-invalid={bad}
            onChange={(e) => patch({ [f.name]: e.target.value })} className={cx(inputCls, 'h-12')} />
        </div>
      );

    case 'area':
      return (
        <div>
          <Label name={f.name} label={f.label} required={f.required} />
          <textarea id={f.name} name={f.name} rows={3} placeholder={f.placeholder} value={str} aria-invalid={bad}
            onChange={(e) => patch({ [f.name]: e.target.value })} className={cx(inputCls, 'min-h-24 resize-y py-3 leading-[1.5]')} />
        </div>
      );

    case 'select':
      return (
        <div>
          <Label name={f.name} label={f.label} required={f.required} />
          <div className="relative">
            <select id={f.name} name={f.name} value={str} aria-invalid={bad}
              onChange={(e) => patch({ [f.name]: e.target.value })} className={cx(inputCls, 'h-12 cursor-pointer appearance-none pr-10')}>
              <option value="">Selecione</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      );

    case 'chips': {
      const sel = arr(v);
      return (
        <div>
          <Head label={f.label} required={f.required} hint={f.hint} />
          <div className="mt-2 flex flex-wrap gap-2">
            {f.options.map((o) => (
              <button key={o} type="button" aria-pressed={sel.includes(o)}
                onClick={() => patch({ [f.name]: f.single ? (sel.includes(o) ? [] : [o]) : toggle(sel, o) })}
                className={cx('focus-ring h-10 rounded-full border px-4 text-sm font-medium transition duration-150 active:scale-95 sm:h-8 sm:px-3', pill(sel.includes(o)))}>
                {o}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'scale': {
      const items = Array.from({ length: f.max - f.min + 1 }, (_, i) => String(f.min + i));
      return (
        <div>
          <p className="text-sm font-medium tracking-[-0.006em]">{f.label}</p>
          {/* celular: 6 por linha (alvos de 44px); a partir de sm, tudo numa linha só */}
          <div className="mt-3 grid grid-cols-6 gap-2 sm:flex sm:gap-1.5">
            {items.map((n) => (
              <button key={n} type="button" aria-pressed={str === n} onClick={() => patch({ [f.name]: n })}
                className={cx('focus-ring h-11 min-w-0 rounded-control border text-sm font-medium tabular-nums transition duration-150 active:scale-95 sm:h-10 sm:flex-1', pill(str === n))}>
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{f.low}</span><span>{f.high}</span></div>
        </div>
      );
    }

    case 'cards': {
      const sel = arr(v);
      const rank = f.rank;
      const top = rank ? arr(answers[rank.name]) : [];
      return (
        <>
          <div>
            <Head label={f.label} required={f.required} hint={f.hint} />
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {f.options.map((o) => {
                const on = sel.includes(o.v);
                return (
                  <button key={o.v} type="button" aria-pressed={on}
                    onClick={() => {
                      const next = toggle(sel, o.v);
                      patch(rank ? { [f.name]: next, [rank.name]: top.filter((x) => next.includes(x)) } : { [f.name]: next });
                    }}
                    className={cx('focus-ring flex min-w-0 items-start gap-3 rounded-field p-4 text-left transition duration-200 ease-out active:scale-[.99]', on ? 'bg-accent-soft' : 'bg-card hover:bg-muted')}>
                    <span className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition duration-200', on ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/25 text-transparent')}>
                      <span key={String(on)} className={on ? 'animate-icon-pop' : undefined}><Check className="size-3.5" /></span>
                    </span>
                    <span className="min-w-0">
                      <span className={cx('block text-sm', on ? 'font-semibold text-accent' : 'font-medium')}>{o.t}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-[1.45] text-muted-foreground">{o.d}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {rank && sel.length > 0 && (
            <div className="border-t pt-4">
              <Head label={rank.label} hint={`Toque na ordem de importância (até ${rank.max}). Toque de novo para remover.`} />
              <div className="mt-2 flex flex-wrap gap-2">
                {sel.map((id) => {
                  const idx = top.indexOf(id);
                  const o = f.options.find((x) => x.v === id);
                  return (
                    <button key={id} type="button" aria-pressed={idx > -1}
                      onClick={() => patch({ [rank.name]: toggle(top, id, rank.max) })}
                      className={cx('focus-ring inline-flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-left text-sm font-medium transition duration-150 active:scale-95 sm:h-9', pill(idx > -1))}>
                      <span className={cx('grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums', idx > -1 ? 'bg-primary-foreground/20' : 'bg-muted')}>
                        {idx > -1 ? idx + 1 : '·'}
                      </span>
                      {o?.t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      );
    }
  }
}
