import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlinkPay - Solana Payment ERP',
  description: 'Professional payment management for Solana-native businesses. Generate Blinks, track invoices, and manage your crypto cash flow.',
  keywords: ['Solana', 'Payments', 'Blinks', 'USDC', 'Cryptocurrency', 'Invoice', 'ERP'],
  authors: [{ name: 'BlinkPay' }],
  openGraph: {
    title: 'BlinkPay - Solana Payment ERP',
    description: 'Professional payment management for Solana-native businesses',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
