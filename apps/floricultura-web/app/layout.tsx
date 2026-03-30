import type { Metadata } from 'next';
import { Source_Sans_3, Crimson_Pro } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flor do Estudante — Floricultura',
  description: 'Flores, buquês e presentes com entrega e retirada. Faça seu pedido online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${sourceSans.variable} ${crimsonPro.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="bottom-center" closeButton />
      </body>
    </html>
  );
}
