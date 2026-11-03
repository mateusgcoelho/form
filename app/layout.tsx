import type { Metadata, Viewport } from 'next';
import { Geist, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-geist', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], weight: '600', variable: '--font-source-serif', display: 'swap' });

export const metadata: Metadata = {
  title: 'Diagnóstico Fratelli',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
