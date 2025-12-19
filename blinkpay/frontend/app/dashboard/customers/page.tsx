import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your customer database</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Customer management features are under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}
