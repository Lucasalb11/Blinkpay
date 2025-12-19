'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Download,
  Filter,
} from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { cn } from '@/lib/utils'

// Mock data for invoices
const mockInvoices = [
  {
    id: 'INV-001',
    client: 'Acme Corporation',
    value: 2450.0,
    date: '2024-01-15',
    status: 'paid',
  },
  {
    id: 'INV-002',
    client: 'TechStart Inc.',
    value: 1200.5,
    date: '2024-01-14',
    status: 'pending',
  },
  {
    id: 'INV-003',
    client: 'Global Services Ltd.',
    value: 5600.0,
    date: '2024-01-10',
    status: 'paid',
  },
  {
    id: 'INV-004',
    client: 'Digital Solutions',
    value: 890.25,
    date: '2024-01-08',
    status: 'overdue',
  },
  {
    id: 'INV-005',
    client: 'Cloud Systems Corp.',
    value: 3200.0,
    date: '2024-01-05',
    status: 'paid',
  },
  {
    id: 'INV-006',
    client: 'StartupXYZ',
    value: 750.0,
    date: '2024-01-03',
    status: 'pending',
  },
]

// Mock data for chart (monthly revenue)
const monthlyData = [
  { month: 'Jan', revenue: 12500, target: 10000 },
  { month: 'Feb', revenue: 15200, target: 12000 },
  { month: 'Mar', revenue: 11800, target: 13000 },
  { month: 'Apr', revenue: 18900, target: 14000 },
  { month: 'May', revenue: 16400, target: 15000 },
  { month: 'Jun', revenue: 21200, target: 16000 },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Paid</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

// Simple bar chart component
function RevenueChart({ data }: { data: typeof monthlyData }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <div className="flex items-end justify-between gap-3 h-48 mt-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative flex flex-col items-center w-full">
            {/* Target line indicator */}
            <div
              className="absolute w-full border-t-2 border-dashed border-slate-300"
              style={{ bottom: `${(item.target / maxRevenue) * 100}%` }}
            />
            {/* Revenue bar */}
            <div
              className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
              style={{ height: `${(item.revenue / maxRevenue) * 180}px` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{item.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { publicKey, connected } = useWallet()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (!connected) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">
              Please connect your wallet to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Balance
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                $12,450.00
              </span>
              <span className="text-sm text-slate-400">USDC</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-emerald-600">+12.5%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Projected Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Projected Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                $8,200.00
              </span>
              <span className="text-sm text-slate-400">USDC</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-slate-400">From</span>
              <span className="font-medium text-amber-600">6 pending</span>
              <span className="text-slate-400">invoices</span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Overdue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                $890.25
              </span>
              <span className="text-sm text-slate-400">USDC</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-600">1 invoice</span>
              <span className="text-slate-400">needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Monthly revenue vs target
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-slate-500">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 border-t-2 border-dashed border-slate-300" />
                <span className="text-slate-500">Target</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <RevenueChart data={monthlyData} />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Total Invoices</span>
              <span className="font-semibold text-slate-900">24</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Paid This Month</span>
              <span className="font-semibold text-emerald-600">18</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Pending</span>
              <span className="font-semibold text-amber-600">5</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Overdue</span>
              <span className="font-semibold text-red-600">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Your latest payment requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Value (USDC)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-slate-900">
                      {invoice.id}
                    </TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${invoice.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
