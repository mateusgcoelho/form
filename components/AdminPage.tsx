'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { api, copyText } from '@/lib/api';
import { Close, Copy, Download, Eye, LinkIcon, Plus, Trash, cx } from './ui';

type Link = {
  token: string;
  label: string;
  created_at: string;
  submitted_at: string | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const linkUrl = (t: string) => `${location.origin}/r/${t}`;
const mdUrl = (t: string) => `/api/admin/links/${encodeURIComponent(t)}/markdown`;

const iconBtn =
  'focus-ring group grid size-11 shrink-0 place-items-center rounded-control text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground sm:size-9';
const iconCls = 'size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none';
const textBtn =
  'focus-ring inline-flex h-11 items-center rounded-control px-3.5 text-sm font-medium text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground sm:h-9';

export default function AdminPage() {
  const [links, setLinks] = useState<Link[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; md: string; token: string } | null>(null);
  const [viewerCopied, setViewerCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setLinks(await api<Link[]>('/api/admin/links'));
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao carregar.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flash = (token: string) => {
    setCopied(token);
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 2000);
  };

  async function create(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const l = await api<Link>('/api/admin/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      setLabel('');
      await copyText(linkUrl(l.token));
      await load();
      flash(l.token);
    } catch (x) {
      setFormError(x instanceof Error ? x.message : 'Erro ao criar.');
    } finally {
      setCreating(false);
    }
  }

  async function view(l: Link) {
    try {
      const { md } = await api<{ md: string }>(`/api/admin/links/${encodeURIComponent(l.token)}/response`);
      setViewer({ title: l.label, md, token: l.token });
      requestAnimationFrame(() => document.getElementById('viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (x) {
      alert(x instanceof Error ? x.message : 'Erro.');
    }
  }

  async function remove(l: Link) {
    const msg = l.submitted_at ? `Excluir "${l.label}" e a resposta recebida? Isso não pode ser desfeito.` : `Excluir o link "${l.label}"?`;
    if (!confirm(msg)) return;
    try {
      await api(`/api/admin/links/${encodeURIComponent(l.token)}`, { method: 'DELETE' });
      setViewer((v) => (v?.token === l.token ? null : v));
      await load();
    } catch (x) {
      alert(x instanceof Error ? x.message : 'Erro.');
    }
  }

  const answered = links?.filter((l) => l.submitted_at).length ?? 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.8125rem] font-medium text-muted-foreground">Backoffice</p>
          <h1 className="display text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] leading-[1.08]">Respostas da Fratelli</h1>
        </div>
        {answered > 0 && (
          <a href="/api/admin/export" download className={cx(textBtn, 'group gap-2')}>
            <Download className="size-4 transition-transform duration-200 ease-out group-hover:translate-y-0.5 motion-reduce:transition-none" />
            Baixar todas (.md)
          </a>
        )}
      </header>

      <section className="mt-8 rounded-3xl bg-card p-5 min-[480px]:p-6">
        <h2 className="text-sm font-semibold">Gerar link de resposta</h2>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">Cada link aceita uma única resposta. Dê um nome para você reconhecer depois.</p>
        <form onSubmit={create} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={120} placeholder="Ex.: Dono, loja Centro"
            className="focus-ring block h-12 min-w-0 flex-1 rounded-field border border-transparent bg-background px-4 text-base transition duration-200 placeholder:text-muted-foreground/70 focus:border-primary/30" />
          <button disabled={creating}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-control bg-primary px-[1.375rem] font-semibold text-primary-foreground transition duration-150 hover:opacity-[.88] active:scale-[.98] disabled:opacity-50">
            <Plus className="size-4" />
            Gerar link
          </button>
        </form>
        {formError && <p role="alert" className="mt-3 text-xs text-negative">{formError}</p>}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Links</h2>
          {links && (
            <span className="text-[0.8125rem] tabular-nums text-muted-foreground">
              {links.length} {links.length === 1 ? 'link' : 'links'} · {answered} {answered === 1 ? 'resposta' : 'respostas'}
            </span>
          )}
        </div>

        {loadError && <p role="alert" className="mt-3 text-sm text-negative">{loadError}</p>}

        {links?.length === 0 && (
          <div className="mt-3 rounded-3xl bg-card py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-background text-muted-foreground">
              <LinkIcon className="size-5" />
            </span>
            <p className="mt-4 font-semibold">Nenhum link ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Gere o primeiro acima e envie para o cliente.</p>
          </div>
        )}

        <ul className="mt-3 flex flex-col gap-2.5">
          {links?.map((l, i) => {
            const done = !!l.submitted_at;
            return (
              <li key={l.token} className="animate-row-in rounded-3xl bg-card p-4 min-[480px]:p-5" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.label}</p>
                    <p className="text-[0.8125rem] text-muted-foreground">
                      {done ? `Respondido em ${fmt(l.submitted_at!)}` : `Criado em ${fmt(l.created_at)}`}
                    </p>
                  </div>
                  <span className={cx('rounded-md px-1.5 py-0.5 text-xs font-medium', done ? 'bg-positive/10 text-positive' : 'bg-muted text-muted-foreground')}>
                    {done ? 'Respondido' : 'Pendente'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <button onClick={async () => { await copyText(linkUrl(l.token)); flash(l.token); }}
                    className="focus-ring group inline-flex h-11 min-w-0 flex-1 items-center gap-2 rounded-control bg-background px-3 text-left text-[0.8125rem] text-muted-foreground transition duration-150 hover:text-foreground sm:h-9">
                    <Copy className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="truncate">{copied === l.token ? 'Link copiado!' : linkUrl(l.token)}</span>
                  </button>
                  {done && (
                    <>
                      <IconButton title="Ver respostas" onClick={() => void view(l)}><Eye className={iconCls} /></IconButton>
                      <a href={mdUrl(l.token)} download title="Baixar .md" aria-label="Baixar .md" className={iconBtn}>
                        <Download className="size-4 transition-transform duration-200 ease-out group-hover:translate-y-0.5 motion-reduce:transition-none" />
                      </a>
                    </>
                  )}
                  <IconButton title="Excluir link" danger onClick={() => void remove(l)}><Trash className={iconCls} /></IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {viewer && (
        <section id="viewer" className="animate-swap-in mt-8 rounded-3xl bg-card p-5 min-[480px]:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="min-w-0 text-sm font-semibold">{viewer.title}</h2>
            <div className="flex items-center gap-1">
              <button className={textBtn} onClick={async () => { await copyText(viewer.md); setViewerCopied(true); setTimeout(() => setViewerCopied(false), 2000); }}>
                {viewerCopied ? 'Copiado!' : 'Copiar .md'}
              </button>
              <a className={textBtn} href={mdUrl(viewer.token)} download>Baixar .md</a>
              <IconButton title="Fechar" onClick={() => setViewer(null)}><Close className="size-4" /></IconButton>
            </div>
          </div>
          <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-field bg-background p-4 text-[0.8125rem] leading-[1.6]">{viewer.md}</pre>
        </section>
      )}
    </main>
  );
}

function IconButton({ title, danger, onClick, children }: { title: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={cx(iconBtn, danger && 'hover:text-negative')}>
      {children}
    </button>
  );
}
