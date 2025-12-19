'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStatsProps {
  walletAddress: string;
}

interface StatsData {
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

async function fetchDashboardStats(walletAddress: string): Promise<StatsData> {
  // First get the merchant ID for this wallet
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) {
    return {
      totalReceived: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };
  }

  // Fetch dashboard summary
  const { data: summary } = await supabase
    .from('merchant_dashboard_summary')
    .select('*')
    .eq('merchant_id', merchant.id)
    .single();

  if (!summary) {
    return {
      totalReceived: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };
  }

  return {
    totalReceived: Number(summary.total_received) || 0,
    pendingAmount: Number(summary.pending_amount) || 0,
    overdueAmount: Number(summary.overdue_amount) || 0,
    paidCount: summary.paid_count || 0,
    pendingCount: summary.pending_count || 0,
    overdueCount: summary.overdue_count || 0,
  };
}

export function DashboardStats({ walletAddress }: DashboardStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', walletAddress],
    queryFn: () => fetchDashboardStats(walletAddress),
    enabled: !!walletAddress,
  });

  const stats = [
    {
      title: 'Total Received',
      value: formatCurrency(data?.totalReceived || 0),
      description: `${data?.paidCount || 0} paid invoices`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Revenue',
      value: formatCurrency(data?.pendingAmount || 0),
      description: `${data?.pendingCount || 0} pending invoices`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Overdue',
      value: formatCurrency(data?.overdueAmount || 0),
      description: `${data?.overdueCount || 0} overdue invoices`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Conversion Rate',
      value: data && data.paidCount + data.pendingCount > 0
        ? `${Math.round((data.paidCount / (data.paidCount + data.pendingCount)) * 100)}%`
        : '0%',
      description: 'Paid vs pending',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
