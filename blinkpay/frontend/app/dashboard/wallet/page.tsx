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
        <p className="text-sm text-slate-500 mt-1">Conecte sua carteira Solana para assinar Blinks.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <WalletButton />
          <p className="text-sm text-slate-600">
            {connected && publicKey
              ? `Conectado: ${publicKey.toBase58()}`
              : "Nenhuma carteira conectada."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
