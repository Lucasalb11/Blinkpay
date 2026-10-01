"use client"

import { use, useCallback, useEffect, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  fromBaseUnits,
  getProgram,
  payRequest,
  statusOf,
  tokenForMint,
  type PaymentRequestAccount,
} from "@/lib/blinkpay"

function parseAddress(raw: string) {
  try {
    return new PublicKey(raw)
  } catch {
    return null
  }
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const address = parseAddress(id)
  const wallet = useAnchorWallet()
  const [request, setRequest] = useState<PaymentRequestAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!address) {
      setError("This link isn't a valid payment request address.")
      return
    }
    try {
      setRequest(await getProgram().account.paymentRequest.fetch(address))
    } catch (e) {
      console.error(e)
      const message = e instanceof Error ? e.message : String(e)
      setError(
        /Account does not exist|has no data/i.test(message)
          ? "No payment request exists at this address on Solana devnet."
          : `Couldn't load this payment request: ${message}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handlePay = async () => {
    if (!wallet || !address) return
    setPaying(true)
    try {
      setSignature(await payRequest(wallet, address))
      toast.success("Paid.")
      await load()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Payment failed.")
    } finally {
      setPaying(false)
    }
  }

  const token = request ? tokenForMint(request.tokenMint) : null
  const status = request ? statusOf(request) : null

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-slate-200">
        <CardContent className="p-8 space-y-6">
          <p className="text-sm font-medium text-blue-600">Blinkpay · Solana devnet</p>

          {error ? <p className="text-slate-700">{error}</p> : null}
          {!error && !request ? <p className="text-slate-500">Loading payment request…</p> : null}

          {request && token ? (
            <>
              <div>
                <p className="text-sm text-slate-500">Amount due</p>
                <p className="text-4xl font-semibold text-slate-900">
                  {fromBaseUnits(request.amount, token.decimals)} {token.symbol}
                </p>
              </div>
              {request.memo ? <p className="text-slate-700">{request.memo}</p> : null}
              <div className="text-sm">
                <p className="text-slate-500">Pays into</p>
                <p className="font-mono text-slate-700 break-all">{request.recipient.toBase58()}</p>
              </div>

              {status === "paid" ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-700">
                  <Check className="w-5 h-5" /> This request has been paid.
                </div>
              ) : status === "cancelled" ? (
                <p className="rounded-lg bg-slate-100 p-4 text-slate-600">This request was cancelled.</p>
              ) : wallet ? (
                <Button onClick={handlePay} disabled={paying} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base">
                  {paying ? "Confirm in your wallet…" : `Pay ${fromBaseUnits(request.amount, token.decimals)} ${token.symbol}`}
                </Button>
              ) : (
                <div className="flex justify-center">
                  <WalletMultiButton />
                </div>
              )}

              {signature ? (
                <a
                  href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  View transaction <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
