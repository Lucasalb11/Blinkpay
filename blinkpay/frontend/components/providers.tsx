'use client'

import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from './theme-provider'
import { WalletProvider } from './wallet-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WalletProvider>
        {children}
        <Toaster position="top-right" richColors />
      </WalletProvider>
    </ThemeProvider>
  )
}
