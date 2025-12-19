'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from './ui/Button'

export const WalletDebug: React.FC = () => {
  const {
    wallets,
    connected,
    connecting,
    publicKey,
    wallet,
    select,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
  } = useWallet()

  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        connected,
        connecting,
        walletName: wallet?.adapter?.name,
        publicKey: publicKey?.toString(),
        walletsCount: wallets.length,
        wallets: wallets.map(w => ({
          name: w.adapter.name,
          readyState: w.readyState,
          connected: w.adapter.connected,
        })),
        phantomAvailable: !!(window as any).solana?.isPhantom,
        solanaAvailable: !!(window as any).solana,
        timestamp: new Date().toISOString(),
      })
    }

    updateDebugInfo()

    // Update every 2 seconds
    const interval = setInterval(updateDebugInfo, 2000)
    return () => clearInterval(interval)
  }, [wallets, connected, connecting, publicKey, wallet])

  const testPhantomConnection = async () => {
    try {
      console.log('🔍 Testing Phantom connection...')
      console.log('Phantom available:', !!(window as any).solana?.isPhantom)

      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom')
      console.log('Phantom wallet found:', !!phantomWallet)

      if (phantomWallet) {
        console.log('Phantom wallet state:', phantomWallet.readyState)
        console.log('Selecting Phantom...')
        await select(phantomWallet.adapter.name)

        console.log('Connecting...')
        await connect()
      }
    } catch (error) {
      console.error('Phantom connection test failed:', error)
    }
  }

  const testWalletModal = () => {
    console.log('🔍 Testing wallet modal...')
    // This should trigger the wallet selection modal
    const walletButton = document.querySelector('[data-testid="wallet-multi-button"]') ||
                        document.querySelector('.wallet-adapter-button')
    if (walletButton) {
      console.log('Found wallet button, clicking...')
      ;(walletButton as HTMLElement).click()
    } else {
      console.log('Wallet button not found')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto z-50">
      <h3 className="font-bold mb-2">Wallet Debug Info</h3>
      <pre className="text-xs bg-gray-800 p-2 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>

      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          onClick={testPhantomConnection}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Test Phantom
        </Button>
        <Button
          size="sm"
          onClick={testWalletModal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Test Modal
        </Button>
        {connected && (
          <Button
            size="sm"
            onClick={() => disconnect()}
            className="bg-red-600 hover:bg-red-700"
          >
            Disconnect
          </Button>
        )}
      </div>

      <div className="text-xs mt-2 text-gray-400">
        Check browser console for detailed logs
      </div>
    </div>
  )
}