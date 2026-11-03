'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { flatten, isEmpty } from '@/lib/schema';
import type { Answers, FormSchema } from '@/lib/schema';
import { api, ApiError } from '@/lib/api';
import { FieldView } from './Fields';
import { CheckBig, ChevronLeft, ChevronRight, cx } from './ui';

const delay = (i: number) => ({ '--i': i }) as CSSProperties;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = 'edit' | 'sending' | 'done' | 'already';

function loadDraft(key: string, lastStep: number): { answers: Answers; step: number } {
  try {
    const d = JSON.parse(localStorage.getItem(key) ?? '{}');
    return { answers: (d.answers ?? {}) as Answers, step: Math.min(Math.max(Number(d.step) || 0, 0), lastStep) };
  } catch {
    return { answers: {}, step: 0 };
  }
}

export default function Wizard({ token, form, alreadyAnswered }: { token: string; form: FormSchema; alreadyAnswered: boolean }) {
  const KEY = `draft:${token}`;
  const last = form.steps.length - 1;

  const [draft] = useState(() => loadDraft(KEY, last));
  const [answers, setAnswers] = useState<Answers>(draft.answers);
  const [step, setStep] = useState(draft.step);
  const [phase, setPhase] = useState<Phase>(alreadyAnswered ? 'already' : 'edit');
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // rascunho local: só enquanto ainda dá para editar
  useEffect(() => {
    if (phase !== 'edit' && phase !== 'sending') return;
    try { localStorage.setItem(KEY, JSON.stringify({ answers, step })); } catch { /* sem storage: segue sem rascunho */ }
  }, [KEY, answers, step, phase]);

  const patch = (p: Answers) => {
    setAnswers((a) => ({ ...a, ...p }));
    setError('');
    setInvalid(null);
  };

  const goTo = (n: number) => {
    setStep(n);
    setError('');
    setInvalid(null);
    // espera o React trocar a etapa e alinha o início dela no topo da tela
    requestAnimationFrame(() => bodyRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }));
  };

  const validate = () => {
    for (const f of flatten(form.steps[step].fields)) {
      if (f.required && isEmpty(answers[f.name])) {
        setInvalid(f.name);
        setError(f.type === 'cards' ? 'Marque pelo menos uma opção para continuar.' : 'Preencha os campos marcados com *.');
        document.getElementById(f.name)?.focus();
        return false;
      }
    }
    return true;
  };

  async function send() {
    setPhase('sending');
    setError('');
    try {
      await api(`/api/r/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      try { localStorage.removeItem(KEY); } catch { /* ignora */ }
      setPhase('done');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setPhase('already'); return; }
      setPhase('edit');
      setError(e instanceof ApiError ? e.message : 'Sem conexão. Suas respostas estão salvas, tente de novo.');
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (phase === 'sending' || !validate()) return;
    if (step < last) goTo(step + 1);
    else void send();
  };

  if (phase === 'done' || phase === 'already') {
    const already = phase === 'already';
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-[clamp(1.75rem,6vh,4.5rem)] sm:px-6">
        <div className="animate-swap-in">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
            <CheckBig className="animate-icon-pop size-6" />
          </span>
          <h1 className="display mt-5 text-balance text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] leading-[1.08]">
            {already ? 'Este link já foi respondido.' : 'Obrigado! Recebemos as suas respostas.'}
          </h1>
          <p className="mt-3 max-w-[50ch] text-pretty text-muted-foreground">
            {already ? 'Se precisar corrigir algo, fale com quem te enviou o link.' : 'Entraremos em contato em breve com uma proposta sob medida.'}
          </p>
        </div>
      </main>
    );
  }

  const s = form.steps[step];
  const pct = Math.round((step / form.steps.length) * 100);

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 pb-48 sm:px-6">
        <section className="pb-6 pt-[clamp(1.75rem,6vh,4.5rem)] sm:pb-10">
          <h1 className="display hero-in text-balance text-[clamp(2rem,1.2rem+4vw,3.5rem)] leading-[1.04]" style={delay(0)}>
            {form.heroTitle}
          </h1>
          <p className="hero-in mt-5 max-w-[50ch] text-pretty text-[clamp(1.0625rem,1rem+0.35vw,1.25rem)] leading-[1.55] tracking-[-0.012em] text-muted-foreground" style={delay(1)}>
            {form.heroLead}
          </p>
        </section>

        <div ref={bodyRef} className="hero-in scroll-mt-4" style={delay(2)}>
          <form id="form" noValidate onSubmit={onSubmit}>
            <div key={step} className="animate-swap-in">
              <h2 className="display text-balance text-[clamp(1.5rem,1.2rem+1.4vw,2.125rem)] leading-[1.1]">{s.title}</h2>
              <p className="mt-2 max-w-[56ch] text-pretty text-muted-foreground">{s.sub}</p>
              <div className="mt-7 flex flex-col gap-5">
                {s.fields.map((f, i) => (
                  <FieldView key={i} f={f} ctx={{ answers, patch, invalid }} />
                ))}
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Barra fixa na base. Fica fora do <main> e de qualquer elemento animado para o position:fixed valer sempre. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-[0.8125rem] text-muted-foreground">
            <span className="min-w-0 truncate font-medium">Etapa {step + 1} de {form.steps.length} · {s.title}</span>
            <span className="shrink-0 tabular-nums">{pct}%</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progresso do formulário" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full origin-left rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
          {error && <p role="alert" className="mb-3 text-sm text-negative">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => step > 0 && goTo(step - 1)} disabled={step === 0}
              className={cx('focus-ring group inline-flex h-12 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground', step === 0 && 'invisible')}>
              <ChevronLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none" />
              Voltar
            </button>
            <button type="submit" form="form" disabled={phase === 'sending'}
              className="focus-ring group inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-[1.375rem] font-semibold text-primary-foreground transition duration-150 hover:opacity-[.88] active:scale-[.98] disabled:opacity-50 sm:flex-none">
              {step === last ? (phase === 'sending' ? 'Enviando…' : 'Enviar respostas') : 'Continuar'}
              <ChevronRight className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
