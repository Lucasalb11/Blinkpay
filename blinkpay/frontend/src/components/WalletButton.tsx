'use client'

import { FC, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Wallet, LogOut, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'

export const WalletButton: FC = () => {
  const { connected, publicKey, disconnect, connecting, wallets, select } = useWallet()
  const [hasPhantom, setHasPhantom] = useState(false)

  useEffect(() => {
    // Check if Phantom wallet is available
    const checkPhantom = () => {
      const phantom = (window as any).solana
      setHasPhantom(!!phantom && phantom.isPhantom)
    }

    checkPhantom()
    // Check again after a short delay to ensure wallets are loaded
    const timeout = setTimeout(checkPhantom, 1000)

    return () => clearTimeout(timeout)
  }, [])

  const handleConnectPhantom = async () => {
    try {
      const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom')
      if (phantomWallet) {
        console.log('Connecting to Phantom wallet...')
        await select(phantomWallet.adapter.name)
        console.log('Phantom wallet selected')
      } else {
        console.error('Phantom wallet not found in available wallets')
        console.log('Available wallets:', wallets.map(w => w.adapter.name))
      }
    } catch (error) {
      console.error('Error connecting to Phantom:', error)
    }
  }

  if (connecting) {
    return (
      <Button variant="outline" disabled className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        Connecting...
      </Button>
    )
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-mono text-green-800 dark:text-green-200">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    )
  }

  // Custom wallet selection with better UX
  return (
    <div className="flex gap-2">
      {hasPhantom && (
        <Button
          onClick={handleConnectPhantom}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Wallet className="w-4 h-4" />
          Connect Phantom
        </Button>
      )}

      <WalletMultiButton />

      {!hasPhantom && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Install Phantom wallet</span>
        </div>
      )}
    </div>
  )
}
