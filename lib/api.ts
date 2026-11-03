export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, init);
  const isJson = r.headers.get('content-type')?.includes('json');
  const data = isJson ? await r.json() : null;
  if (!r.ok) {
    const fallback = r.status === 401 ? 'Acesso negado. Recarregue a página e informe a senha.' : `Erro ${r.status}`;
    throw new ApiError(r.status, data?.error ?? fallback);
  }
  return data as T;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const a = document.createElement('textarea');
    a.value = text;
    document.body.appendChild(a);
    a.select();
    const ok = document.execCommand('copy');
    a.remove();
    return ok;
  }
}
