import { createClient } from '@libsql/client';
import type { Client, Row } from '@libsql/client';
import { randomBytes } from 'node:crypto';
import { formSchema } from './questions';
import type { Answers, FormSchema } from './schema';

// SQLite via libSQL: arquivo local em desenvolvimento, Turso em produção (mesmo SQL, mesmo modelo).
const url = process.env.TURSO_DATABASE_URL ?? 'file:data/app.db';
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  throw new Error('Na Vercel, defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN (arquivo local não persiste).');
}

const db: Client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

export type LinkRow = {
  token: string;
  label: string;
  form_id: number;
  created_at: string;
  submitted_at: string | null;
};

const now = () => new Date().toISOString();
const link = (r: Row): LinkRow => ({
  token: String(r.token),
  label: String(r.label),
  form_id: Number(r.form_id),
  created_at: String(r.created_at),
  submitted_at: r.submitted_at === null ? null : String(r.submitted_at),
});

async function init() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS forms (
      id         INTEGER PRIMARY KEY,
      schema     TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS links (
      token        TEXT PRIMARY KEY,
      label        TEXT NOT NULL,
      form_id      INTEGER NOT NULL REFERENCES forms(id),
      created_at   TEXT NOT NULL,
      submitted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS responses (
      id         INTEGER PRIMARY KEY,
      token      TEXT NOT NULL UNIQUE REFERENCES links(token),
      answers    TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Grava uma nova versão do formulário quando lib/questions.ts mudou desde a última subida.
  const seed = JSON.stringify(formSchema);
  const latest = await db.execute('SELECT schema FROM forms ORDER BY id DESC LIMIT 1');
  if (latest.rows[0]?.schema !== seed) {
    await db.execute({ sql: 'INSERT INTO forms (schema, created_at) VALUES (?, ?)', args: [seed, now()] });
  }
}

// uma única inicialização por processo; se falhar, tenta de novo na próxima chamada
let ready: Promise<void> | undefined;
const ensure = () => (ready ??= init().catch((e) => { ready = undefined; throw e; }));

export async function getForm(id: number): Promise<FormSchema> {
  await ensure();
  const r = await db.execute({ sql: 'SELECT schema FROM forms WHERE id = ?', args: [id] });
  if (!r.rows[0]) throw new Error(`form ${id} not found`);
  return JSON.parse(String(r.rows[0].schema)) as FormSchema;
}

export async function latestFormId(): Promise<number> {
  await ensure();
  const r = await db.execute('SELECT MAX(id) AS id FROM forms');
  return Number(r.rows[0].id);
}

export async function createLink(label: string): Promise<LinkRow> {
  const token = randomBytes(12).toString('base64url');
  const row = { token, label, form_id: await latestFormId(), created_at: now(), submitted_at: null };
  await db.execute({
    sql: 'INSERT INTO links (token, label, form_id, created_at) VALUES (?, ?, ?, ?)',
    args: [row.token, row.label, row.form_id, row.created_at],
  });
  return row;
}

export async function getLink(token: string): Promise<LinkRow | undefined> {
  await ensure();
  const r = await db.execute({ sql: 'SELECT * FROM links WHERE token = ?', args: [token] });
  return r.rows[0] ? link(r.rows[0]) : undefined;
}

export async function listLinks(): Promise<LinkRow[]> {
  await ensure();
  const r = await db.execute('SELECT * FROM links ORDER BY created_at DESC');
  return r.rows.map(link);
}

export async function deleteLink(token: string): Promise<boolean> {
  await ensure();
  const [, res] = await db.batch(
    [
      { sql: 'DELETE FROM responses WHERE token = ?', args: [token] },
      { sql: 'DELETE FROM links WHERE token = ?', args: [token] },
    ],
    'write',
  );
  return res.rowsAffected > 0;
}

/**
 * Salva a resposta uma única vez por link e fixa o link na versão do formulário respondida.
 * A restrição UNIQUE em responses.token garante a unicidade; o batch é transacional.
 */
export async function saveResponse(token: string, formId: number, answers: Answers): Promise<boolean> {
  await ensure();
  const t = now();
  try {
    await db.batch(
      [
        { sql: 'INSERT INTO responses (token, answers, created_at) VALUES (?, ?, ?)', args: [token, JSON.stringify(answers), t] },
        { sql: 'UPDATE links SET submitted_at = ?, form_id = ? WHERE token = ?', args: [t, formId, token] },
      ],
      'write',
    );
    return true;
  } catch (e) {
    if (e instanceof Error && /UNIQUE|constraint/i.test(e.message)) return false;
    throw e;
  }
}

export async function getAnswers(token: string): Promise<Answers | undefined> {
  await ensure();
  const r = await db.execute({ sql: 'SELECT answers FROM responses WHERE token = ?', args: [token] });
  return r.rows[0] ? (JSON.parse(String(r.rows[0].answers)) as Answers) : undefined;
}
