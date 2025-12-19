'use client'

import { useEffect, useState } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { WalletButton } from '@/components/WalletButton'
import { useWallet } from '@solana/wallet-adapter-react'

export function ClientOnly() {
  const [isClient, setIsClient] = useState(false)
  const { connected } = useWallet()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading BlikPay...</p>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">BlikPay</h1>
            <p className="text-lg text-white/80">
              Lightning-fast payments on Solana
            </p>
            <p className="text-sm text-white/60 mt-2">
              Direct payments • Payment requests • Scheduled charges
            </p>
          </div>

          <div className="space-y-4">
            <WalletButton />

            <div className="text-xs text-white/50 mt-6">
              Connect your wallet to access the full BlikPay experience
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <Dashboard />
}