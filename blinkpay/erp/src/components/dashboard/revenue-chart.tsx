'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

interface RevenueChartProps {
  walletAddress: string;
}

interface DailyData {
  date: string;
  amount: number;
  count: number;
}

async function fetchDailyVolume(walletAddress: string): Promise<DailyData[]> {
  // Get merchant ID
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) {
    return generateEmptyData();
  }

  // Fetch last 7 days of transaction data
  const { data: volume } = await supabase
    .from('daily_transaction_volume')
    .select('*')
    .eq('merchant_id', merchant.id)
    .gte('date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  if (!volume || volume.length === 0) {
    return generateEmptyData();
  }

  // Aggregate by date (in case there are multiple tokens)
  const aggregated = volume.reduce<Record<string, DailyData>>((acc, row) => {
    const date = row.date;
    if (!acc[date]) {
      acc[date] = { date, amount: 0, count: 0 };
    }
    acc[date].amount += Number(row.total_amount) || 0;
    acc[date].count += row.transaction_count || 0;
    return acc;
  }, {});

  // Fill in missing days
  const result: DailyData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    result.push(aggregated[date] || { date, amount: 0, count: 0 });
  }

  return result;
}

function generateEmptyData(): DailyData[] {
  const result: DailyData[] = [];
  for (let i = 6; i >= 0; i--) {
    result.push({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      amount: 0,
      count: 0,
    });
  }
  return result;
}

export function RevenueChart({ walletAddress }: RevenueChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['daily-volume', walletAddress],
    queryFn: () => fetchDailyVolume(walletAddress),
    enabled: !!walletAddress,
  });

  const chartData = (data || generateEmptyData()).map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'EEE'),
  }));

  const totalAmount = chartData.reduce((sum, d) => sum + d.amount, 0);
  const totalCount = chartData.reduce((sum, d) => sum + d.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Overview</CardTitle>
        <CardDescription>
          {totalCount > 0 
            ? `${totalCount} transactions · $${totalAmount.toLocaleString()} USDC this week`
            : 'No transactions this week'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()} USDC`, 'Revenue']}
                labelFormatter={(label) => `Day: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar
                dataKey="amount"
                fill="hsl(221.2 83.2% 53.3%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
