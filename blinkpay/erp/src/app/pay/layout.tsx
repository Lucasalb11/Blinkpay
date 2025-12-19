import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pay with BlinkPay',
  description: 'Secure payment via Solana blockchain',
};

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
