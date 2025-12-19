import { ArrowUpRight, DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RevenueChart } from "@/components/revenue-chart"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 text-balance">Welcome back, Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your payments today.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Charge
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Received</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">12,450 USDC</div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Projected Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">8,250 USDC</div>
            <p className="text-xs text-slate-500 mt-1">Expected this month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Overdue</CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">2,350 USDC</div>
            <p className="text-xs text-amber-600 mt-1">3 invoices need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Revenue Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/dashboard/invoices/new">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Create New Charge</h3>
                <p className="text-sm text-slate-500">Generate a Blink payment link</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/dashboard/customers">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
                <Plus className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Add Customer</h3>
                <p className="text-sm text-slate-500">Add a new customer to your list</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
