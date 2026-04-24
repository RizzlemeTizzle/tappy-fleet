import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Tappy Charge Fleet',
  description: 'Fleet management dashboard for Tappy Charge EV charging',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
