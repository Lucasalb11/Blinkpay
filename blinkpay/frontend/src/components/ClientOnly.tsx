'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, Shield, Clock, Wallet } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { WalletDebug } from '@/components/WalletDebug'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/Button'

export function ClientOnly() {
  const [isClient, setIsClient] = useState(false)
  const { connected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Redirect to dashboard when connected
    if (isClient && connected) {
      router.push('/dashboard')
    }
  }, [isClient, connected, router])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading BlinkPay...</p>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Navigation */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">BlinkPay</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              Powered by Solana
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Lightning-fast payments for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                modern business
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Accept USDC payments instantly. Create invoices, schedule recurring charges, 
              and manage your finances with enterprise-grade security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <WalletButton />
              <Button variant="outline" className="gap-2 h-12 px-6 text-base">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-20">
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Instant Payments
                </h3>
                <p className="text-slate-600 text-sm">
                  Send and receive payments in seconds with near-zero transaction fees on Solana.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 mb-4">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Secure & Audited
                </h3>
                <p className="text-slate-600 text-sm">
                  Built with security-first architecture. Smart contracts audited and battle-tested.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 mb-4">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Scheduled Charges
                </h3>
                <p className="text-slate-600 text-sm">
                  Automate recurring payments and subscriptions with programmable smart contracts.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-600">BlinkPay</span>
              </div>
              <p className="text-sm text-slate-500">
                © 2024 BlinkPay. Built on Solana.
              </p>
            </div>
          </div>
        </footer>

        {/* Wallet Debug Component - Only in development */}
        {process.env.NODE_ENV === 'development' && <WalletDebug />}
      </div>
    )
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}