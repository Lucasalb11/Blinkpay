'use client'

import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { useBlinkPay, useBlinkPayProgramId } from '@/lib/useBlinkPay'
import { Button } from './ui/Button'
import { X, Plus, Loader2, Copy, Check } from 'lucide-react'

interface PaymentRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PaymentRequestModal: FC<PaymentRequestModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet()
  const program = useBlinkPay()
  const programId = useBlinkPayProgramId()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestLink, setRequestLink] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey) return

    try {
      setLoading(true)
      setError('')

      const amountLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)

      if (amountLamports <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const currentTime = Math.floor(Date.now() / 1000)

      // Create payment request
      await program.methods
        .createPaymentRequest(
          amountLamports,
          programId,
          publicKey, // recipient is the current user
          memo || 'Payment request via BlikPay',
          currentTime
        )
        .accounts({
          authority: publicKey,
          paymentRequest: PublicKey.findProgramAddressSync(
            [
              Buffer.from('payment_request'),
              publicKey.toBuffer(),
              publicKey.toBuffer(), // recipient is also authority
              new anchor.BN(amountLamports).toArrayLike(Buffer, 'le', 8),
              new anchor.BN(currentTime).toArrayLike(Buffer, 'le', 8),
            ],
            programId
          )[0],
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc()

      // Generate shareable link
      const requestId = PublicKey.findProgramAddressSync(
        [
          Buffer.from('payment_request'),
          publicKey.toBuffer(),
          publicKey.toBuffer(),
          new anchor.BN(amountLamports).toArrayLike(Buffer, 'le', 8),
          new anchor.BN(currentTime).toArrayLike(Buffer, 'le', 8),
        ],
        programId
      )[0].toString()

      setRequestLink(`${window.location.origin}/pay/${requestId}`)

      // Reset form
      setAmount('')
      setMemo('')
    } catch (err: any) {
      console.error('Payment request error:', err)
      setError(err.message || 'Failed to create payment request')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(requestLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Create Payment Request
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!requestLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount (SOL)
              </label>
              <input
                type="number"
                step="0.000000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Memo (Optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What's this payment for?"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                maxLength={200}
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Request
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Payment Request Created!
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Share this link to receive payments
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={requestLink}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}