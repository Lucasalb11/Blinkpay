'use client'

import { Inter } from 'next/font/google'
import { useEffect } from 'react'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { initAnalytics, trackPageView } from '@/lib/analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize analytics and monitoring
    initAnalytics()

    // Track initial page view
    trackPageView('app_loaded')
  }, [])

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ErrorBoundary>
          <WalletProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}