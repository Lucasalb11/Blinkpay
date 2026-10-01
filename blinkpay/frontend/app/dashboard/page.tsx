"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { BN } from "@coral-xyz/anchor"
import { CheckCircle2, Clock, FileText, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fromBaseUnits, listRequestsFor, statusOf, tokenForMint } from "@/lib/blinkpay"

type Totals = Record<string, { amount: BN; decimals: number }>

function formatTotals(totals: Totals) {
  const entries = Object.entries(totals)
  if (entries.length === 0) return "0"
  return entries.map(([symbol, t]) => `${fromBaseUnits(t.amount, t.decimals)} ${symbol}`).join(" + ")
}

export default function DashboardPage() {
  const { publicKey } = useWallet()
  const [stats, setStats] = useState<{ received: Totals; pending: Totals; count: number } | null>(null)

  useEffect(() => {
    if (!publicKey) return
    setStats(null)
    listRequestsFor(publicKey)
      .then((rows) => {
        const received: Totals = {}
        const pending: Totals = {}
        for (const { account } of rows) {
          const token = tokenForMint(account.tokenMint)
          const status = statusOf(account)
          const bucket = status === "paid" ? received : status === "pending" ? pending : null
          if (!bucket) continue
          const current = bucket[token.symbol] ?? { amount: new BN(0), decimals: token.decimals }
          bucket[token.symbol] = { amount: current.amount.add(account.amount), decimals: token.decimals }
        }
        setStats({ received, pending, count: rows.length })
      })
      .catch(() => setStats({ received: {}, pending: {}, count: 0 }))
  }, [publicKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Payment links paid into your wallet on Solana devnet.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create payment link
          </Button>
        </Link>
      </div>

      {!publicKey ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-slate-600">Connect a wallet to see what has been paid into it.</p>
            <WalletMultiButton />
            <p className="text-xs text-slate-500">Devnet only. Get test SOL at faucet.solana.com.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi title="Received" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} value={stats ? formatTotals(stats.received) : "…"} />
          <Kpi title="Awaiting payment" icon={<Clock className="w-4 h-4 text-amber-500" />} value={stats ? formatTotals(stats.pending) : "…"} />
          <Kpi title="Payment links" icon={<FileText className="w-4 h-4 text-slate-400" />} value={stats ? String(stats.count) : "…"} />
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Create a payment link for an amount in SOL or USDC. It&apos;s stored as an account on Solana.</li>
            <li>Share the link. Whoever opens it pays from any wallet, and the program sends the funds straight to you.</li>
            <li>The request is marked paid on-chain, so it can&apos;t be paid twice.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({ title, icon, value }: { title: string; icon: React.ReactNode; value: string }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )
}
