import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your Solana wallet and balances</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Wallet management features are under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}
