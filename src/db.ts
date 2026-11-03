import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { formSchema } from './questions.ts';
import type { Answers, FormSchema } from './schema.ts';

const path = process.env.DB_PATH ?? 'data/app.db';
mkdirSync(dirname(path), { recursive: true });

const db = new DatabaseSync(path);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

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
    token      TEXT NOT NULL UNIQUE REFERENCES links(token) ON DELETE CASCADE,
    answers    TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const now = () => new Date().toISOString();
const rows = <T>(v: unknown) => v as T[];
const row = <T>(v: unknown) => v as T | undefined;

// Grava uma nova versão do formulário quando questions.ts mudou desde a última subida.
const latest = row<{ id: number; schema: string }>(
  db.prepare('SELECT id, schema FROM forms ORDER BY id DESC LIMIT 1').get(),
);
const seed = JSON.stringify(formSchema);
if (!latest || latest.schema !== seed) {
  db.prepare('INSERT INTO forms (schema, created_at) VALUES (?, ?)').run(seed, now());
}

export type LinkRow = {
  token: string;
  label: string;
  form_id: number;
  created_at: string;
  submitted_at: string | null;
};

export function getForm(id: number): FormSchema {
  const r = row<{ schema: string }>(db.prepare('SELECT schema FROM forms WHERE id = ?').get(id));
  if (!r) throw new Error(`form ${id} not found`);
  return JSON.parse(r.schema) as FormSchema;
}

export function latestFormId(): number {
  return db.prepare('SELECT MAX(id) AS id FROM forms').get()!.id as number;
}

export function createLink(label: string): LinkRow {
  const token = randomBytes(12).toString('base64url');
  const created_at = now();
  const form_id = latestFormId();
  db.prepare('INSERT INTO links (token, label, form_id, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    label,
    form_id,
    created_at,
  );
  return { token, label, form_id, created_at, submitted_at: null };
}

export function getLink(token: string): LinkRow | undefined {
  return row<LinkRow>(db.prepare('SELECT * FROM links WHERE token = ?').get(token));
}

export function listLinks(): LinkRow[] {
  return rows<LinkRow>(db.prepare('SELECT * FROM links ORDER BY created_at DESC').all());
}

export function deleteLink(token: string): boolean {
  return Number(db.prepare('DELETE FROM links WHERE token = ?').run(token).changes) > 0;
}

/**
 * Salva a resposta uma única vez por link e fixa o link na versão do formulário que foi
 * respondida. Retorna false se já respondido.
 */
export function saveResponse(token: string, formId: number, answers: Answers): boolean {
  const t = now();
  db.exec('BEGIN IMMEDIATE');
  try {
    const done = db
      .prepare('UPDATE links SET submitted_at = ?, form_id = ? WHERE token = ? AND submitted_at IS NULL')
      .run(t, formId, token);
    if (Number(done.changes) === 0) {
      db.exec('ROLLBACK');
      return false;
    }
    db.prepare('INSERT INTO responses (token, answers, created_at) VALUES (?, ?, ?)').run(
      token,
      JSON.stringify(answers),
      t,
    );
    db.exec('COMMIT');
    return true;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function getAnswers(token: string): Answers | undefined {
  const r = row<{ answers: string }>(
    db.prepare('SELECT answers FROM responses WHERE token = ?').get(token),
  );
  return r ? (JSON.parse(r.answers) as Answers) : undefined;
}
