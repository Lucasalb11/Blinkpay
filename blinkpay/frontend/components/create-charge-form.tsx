"use client"

import { useState } from "react"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Copy, ExternalLink, Twitter } from "lucide-react"
import { toast } from "sonner"
import { createPaymentRequest, type TokenSymbol } from "@/lib/blinkpay"

export function CreateChargeForm() {
  const wallet = useAnchorWallet()
  const [token, setToken] = useState<TokenSymbol>("SOL")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ link: string; signature: string } | null>(null)

  const handleCreate = async () => {
    if (!wallet) return
    setIsLoading(true)
    try {
      const { pda, signature } = await createPaymentRequest(wallet, { token, amount, memo })
      setResult({ link: `${window.location.origin}/pay/${pda.toBase58()}`, signature })
      toast.success("Payment link created on Solana devnet.")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Couldn't create the payment request.")
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Payment link created</h2>
            <p className="text-sm text-slate-500 mt-2">Anyone with this link can pay it from their wallet.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-mono text-slate-700 break-all">{result.link}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(result.link)
                toast.success("Link copied.")
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy link
            </Button>
            <Button
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Pay me with Blinkpay: ${result.link}`)}`,
                  "_blank",
                )
              }
              variant="outline"
              className="flex-1 border-slate-200 bg-transparent"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Share on X
            </Button>
          </div>
          <a
            href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            View transaction <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div>
            <Button onClick={() => setResult(null)} variant="ghost" className="text-slate-600">
              Create another charge
            </Button>
          </div>
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="p-8">
      {!wallet ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="text-sm text-slate-600">Connect the wallet that should receive the payment.</p>
          <WalletMultiButton />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label className="text-slate-700">Paid into</Label>
            <p className="font-mono text-sm text-slate-600 break-all">{wallet.publicKey.toBase58()}</p>
          </div>

          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-slate-700">
                Token
              </Label>
              <Select value={token} onValueChange={(v) => setToken(v as TokenSymbol)}>
                <SelectTrigger id="token" className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                className="border-slate-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo" className="text-slate-700">
              Description
            </Label>
            <Textarea
              id="memo"
              placeholder="What is this charge for?"
              className="border-slate-200 min-h-[100px]"
              maxLength={200}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">Stored on-chain, up to 200 characters.</p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
            disabled={isLoading || !amount || Number(amount) <= 0}
          >
            {isLoading ? "Confirm in your wallet…" : "Create payment link"}
          </Button>
        </form>
      )}
    </CardContent>
  )
}
