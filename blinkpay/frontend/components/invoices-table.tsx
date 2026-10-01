"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Copy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { fromBaseUnits, listRequestsFor, statusOf, tokenForMint } from "@/lib/blinkpay"

const statusConfig = {
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
}

type Row = Awaited<ReturnType<typeof listRequestsFor>>[number]

export function InvoicesTable() {
  const { publicKey } = useWallet()
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    if (!publicKey) return
    setRows(null)
    listRequestsFor(publicKey)
      .then(setRows)
      .catch((e) => {
        console.error(e)
        toast.error("Couldn't load payment requests from devnet.")
        setRows([])
      })
  }, [publicKey])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-sm text-slate-600">Connect your wallet to see the payment requests paid into it.</p>
        <WalletMultiButton />
      </div>
    )
  }

  if (!rows) return <p className="py-10 text-center text-sm text-slate-500">Loading from Solana devnet…</p>

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-sm text-slate-600">No payment requests for this wallet yet.</p>
        <Link href="/dashboard/invoices/new" className="text-sm text-blue-600 hover:underline">
          Create your first payment link
        </Link>
      </div>
    )
  }

  const linkFor = (address: string) => `${window.location.origin}/pay/${address}`

  return (
    <div className="rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-slate-600 font-medium">Status</TableHead>
            <TableHead className="text-slate-600 font-medium">Description</TableHead>
            <TableHead className="text-slate-600 font-medium">Created</TableHead>
            <TableHead className="text-slate-600 font-medium">Amount</TableHead>
            <TableHead className="text-slate-600 font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ publicKey: address, account }) => {
            const status = statusOf(account)
            const token = tokenForMint(account.tokenMint)
            return (
              <TableRow key={address.toBase58()} className="hover:bg-slate-50">
                <TableCell>
                  <Badge variant="secondary" className={statusConfig[status].className}>
                    {statusConfig[status].label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-900">{account.memo || "—"}</TableCell>
                <TableCell className="text-slate-600">
                  {new Date(account.createdAt.toNumber() * 1000).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {fromBaseUnits(account.amount, token.decimals)} {token.symbol}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(linkFor(address.toBase58()))
                        toast.success("Payment link copied.")
                      }}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Open payment page"
                      onClick={() => window.open(linkFor(address.toBase58()), "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
