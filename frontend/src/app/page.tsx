'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from "@/components/WalletButton"
import { Button } from "@/components/ui/Button"
import { CreditCard, Clock, Zap } from "lucide-react"

export default function Home() {
  const { connected } = useWallet()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [scheduledModalOpen, setScheduledModalOpen] = useState(false)

  // Prevent hydration mismatch by not rendering wallet-dependent content on server
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              BlikPay
            </h1>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Payments Reimagined on Solana
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Experience the future of payments with BlikPay. Send SOL, create payment requests,
            and schedule automatic charges - all non-custodial and lightning fast.
          </p>
          {mounted ? (
            connected ? (
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={() => alert('Payment functionality coming soon!')}
                >
                  <CreditCard className="w-5 h-5" />
                  Make Payment
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={() => alert('Payment request functionality coming soon!')}
                >
                  <Clock className="w-5 h-5" />
                  Request Payment
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={() => alert('Scheduled payment functionality coming soon!')}
                >
                  <Zap className="w-5 h-5" />
                  Schedule Payment
                </Button>
              </div>
            ) : (
              <div className="text-slate-600 dark:text-slate-300">
                Connect your wallet to start using BlikPay
              </div>
            )
          ) : (
            <div className="text-slate-600 dark:text-slate-300">
              Loading...
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <CreditCard className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Instant Payments
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Send SOL or SPL tokens instantly with sub-second confirmation times.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <Clock className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Payment Requests
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Create shareable payment links that anyone can fulfill automatically.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <Zap className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Scheduled Charges
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Set up recurring payments or future charges that execute automatically.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">&lt;400ms</div>
              <div className="text-slate-600 dark:text-slate-300">Average transaction time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">$0.00025</div>
              <div className="text-slate-600 dark:text-slate-300">Average transaction fee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
              <div className="text-slate-600 dark:text-slate-300">Scalability potential</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600 dark:text-slate-300">
            <p>&copy; 2025 BlikPay. Built for Solana University Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
