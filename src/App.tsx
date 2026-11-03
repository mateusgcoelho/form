import AdminPage from './AdminPage.tsx';
import FormPage from './FormPage.tsx';

// Duas rotas só (/r/:token e /admin), então dispensa biblioteca de roteamento.
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') return <AdminPage />;

  const m = path.match(/^\/r\/([A-Za-z0-9_-]+)$/);
  if (m) return <FormPage token={m[1]} />;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-3xl place-items-center px-4 text-center">
      <p className="text-muted-foreground">Use o link que você recebeu para responder.</p>
    </main>
  );
}
