'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletButton } from "@/components/wallet-button"
import { useWallet } from "@solana/wallet-adapter-react"

export default function WalletPage() {
  const { publicKey, connected } = useWallet()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Connect the Solana wallet that receives payments.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <WalletButton />
          <p className="text-sm text-slate-600">
            {connected && publicKey
              ? `Connected: ${publicKey.toBase58()}`
              : "No wallet connected."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
