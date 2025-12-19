'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { DashboardStats } from '@/components/dashboard/stats';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentInvoices } from '@/components/dashboard/recent-invoices';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
  const { publicKey } = useWallet();

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, welcome back!
        </h2>
        <p className="text-gray-600 mt-1">
          Here&apos;s what&apos;s happening with your payments today.
        </p>
      </div>

      {/* Stats cards */}
      <DashboardStats walletAddress={publicKey?.toString() || ''} />

      {/* Chart and Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart walletAddress={publicKey?.toString() || ''} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent invoices */}
      <RecentInvoices walletAddress={publicKey?.toString() || ''} />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
