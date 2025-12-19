'use client'

import { FC, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, FileText, Loader2 } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { SOL_MINT, PYUSD_MINT, UI_CONSTANTS } from '@/lib/config'
import { useBlikPay } from '@/lib/blinkpay'

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RequestModal: FC<RequestModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet()
  const { getClient } = useBlikPay()

  const [amount, setAmount] = useState('')
  const [tokenType, setTokenType] = useState<'SOL' | 'PYUSD'>('SOL')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      toast.error('Wallet not connected')
      return
    }

    try {
      setIsLoading(true)

      // Validate amount
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Invalid amount')
        return
      }

      // Convert to lamports/smallest units
      const amountLamports = tokenType === 'SOL'
        ? Math.floor(amountNum * 1e9) // SOL to lamports
        : Math.floor(amountNum * 1e6)  // PYUSD to smallest units

      if (amountLamports < UI_CONSTANTS.MIN_AMOUNT_SOL * 1e9) {
        toast.error('Amount too small')
        return
      }

      // Validate memo
      if (memo.length > UI_CONSTANTS.MAX_MEMO_LENGTH) {
        toast.error(`Memo too long (max ${UI_CONSTANTS.MAX_MEMO_LENGTH} characters)`)
        return
      }

      const client = getClient()
      const tokenMint = tokenType === 'SOL' ? SOL_MINT : PYUSD_MINT

      // Create payment request where the current user is the recipient
      const tx = await client.createPaymentRequest({
        amount: amountLamports,
        tokenMint,
        recipient: publicKey, // Current user is the recipient
        memo: memo.trim(),
      })

      toast.success('Payment request created successfully! Share the link to receive payment.')
      console.log('Transaction:', tx)

      // Reset form
      setAmount('')
      setMemo('')
      onClose()

    } catch (error: any) {
      console.error('Request creation error:', error)
      toast.error(error.message || 'Failed to create payment request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Request Payment
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Amount and Token Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token
                </label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as 'SOL' | 'PYUSD')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="SOL">SOL</option>
                  <option value="PYUSD">PYUSD</option>
                </select>
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What is this payment for?"
                rows={3}
                maxLength={UI_CONSTANTS.MAX_MEMO_LENGTH}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {memo.length}/{UI_CONSTANTS.MAX_MEMO_LENGTH} characters
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Shareable Payment Link</p>
                  <p className="mt-1">
                    Once created, you'll receive a shareable link that others can use to pay you instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Create Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}