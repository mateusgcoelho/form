import type { Metadata } from 'next';
import AdminPage from '@/components/AdminPage';

export const metadata: Metadata = { title: 'Backoffice Fratelli' };

export default function Page() {
  return <AdminPage />;
}
