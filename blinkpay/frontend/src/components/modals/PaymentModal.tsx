'use client'

import { FC, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Send, Loader2 } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { SOL_MINT, PYUSD_MINT, UI_CONSTANTS } from '@/lib/config'
import { useBlikPay } from '@/lib/blinkpay'
import { sanitizeMemo, validateSolanaAddress, validateAmount, globalRateLimiter, logSecurityEvent } from '@/lib/security'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PaymentModal: FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet()
  const { getClient } = useBlikPay()

  const [recipient, setRecipient] = useState('')
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

      // SECURITY: Rate limiting check
      if (!globalRateLimiter.canProceed('payment_request')) {
        const remaining = globalRateLimiter.getRemainingAttempts('payment_request')
        toast.error(`Too many requests. Try again in a minute. (${remaining} attempts remaining)`)
        logSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          details: { action: 'payment_request', recipient, amount }
        })
        return
      }

      // SECURITY: Input sanitization and validation
      const sanitizedRecipient = recipient.trim()
      const sanitizedMemo = sanitizeMemo(memo)

      // Validate recipient address
      if (!validateSolanaAddress(sanitizedRecipient)) {
        toast.error('Invalid recipient address format')
        logSecurityEvent({
          type: 'INPUT_VALIDATION_FAILED',
          details: { field: 'recipient', value: sanitizedRecipient }
        })
        return
      }

      let recipientPubkey: PublicKey
      try {
        recipientPubkey = new PublicKey(sanitizedRecipient)
      } catch {
        toast.error('Invalid recipient address')
        return
      }

      // Validate amount
      if (!validateAmount(amount)) {
        toast.error('Invalid amount - must be a positive number')
        logSecurityEvent({
          type: 'INPUT_VALIDATION_FAILED',
          details: { field: 'amount', value: amount }
        })
        return
      }

      const amountNum = parseFloat(amount)

      // Convert to lamports/smallest units
      const amountLamports = tokenType === 'SOL'
        ? Math.floor(amountNum * 1e9) // SOL to lamports
        : Math.floor(amountNum * 1e6)  // PYUSD to smallest units

      if (amountLamports < UI_CONSTANTS.MIN_AMOUNT_SOL * 1e9) {
        toast.error('Amount too small')
        return
      }

      const client = getClient()
      const tokenMint = tokenType === 'SOL' ? SOL_MINT : PYUSD_MINT

      const tx = await client.createPaymentRequest({
        amount: amountLamports,
        tokenMint,
        recipient: recipientPubkey,
        memo: sanitizedMemo,
      })

      toast.success('Payment request created successfully!')
      console.log('Transaction:', tx)

      // Reset form
      setRecipient('')
      setAmount('')
      setMemo('')
      onClose()

    } catch (error: any) {
      console.error('Payment error:', error)
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
              Send Payment
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

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
                Memo (Optional)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                maxLength={UI_CONSTANTS.MAX_MEMO_LENGTH}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {memo.length}/{UI_CONSTANTS.MAX_MEMO_LENGTH} characters
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Payment
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