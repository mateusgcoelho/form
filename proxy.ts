import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Compara sem sair no primeiro caractere diferente.
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

/** Basic Auth no backoffice (/admin) e na API dele (/api/admin). */
export function proxy(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return new NextResponse('ADMIN_PASSWORD não configurada.', { status: 500 });

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const raw = decode(header.slice(6));
      const i = raw.indexOf(':');
      const user = raw.slice(0, i);
      const pass = raw.slice(i + 1);
      if (i > -1 && safeEqual(user, process.env.ADMIN_USER ?? 'admin') && safeEqual(pass, password)) {
        return NextResponse.next();
      }
    } catch {
      /* cabeçalho malformado cai no 401 */
    }
  }

  return new NextResponse('Autenticação necessária.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Fratelli", charset="UTF-8"' },
  });
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
