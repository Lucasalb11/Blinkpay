'use client'

import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { useBlinkPay, useBlinkPayProgramId } from '@/lib/useBlinkPay'
import { Button } from './ui/Button'
import { X, Clock, Loader2 } from 'lucide-react'

interface ScheduledPaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ScheduledPaymentModal: FC<ScheduledPaymentModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet()
  const program = useBlinkPay()
  const programId = useBlinkPayProgramId()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [executeAt, setExecuteAt] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !publicKey) return

    try {
      setLoading(true)
      setError('')

      const recipientPubkey = new PublicKey(recipient)
      const amountLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
      const executeTimestamp = Math.floor(new Date(executeAt).getTime() / 1000)

      if (amountLamports <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      if (executeTimestamp <= Math.floor(Date.now() / 1000)) {
        throw new Error('Execution time must be in the future')
      }

      const currentTime = Math.floor(Date.now() / 1000)

      await program.methods
        .createScheduledCharge(
          amountLamports,
          programId,
          recipientPubkey,
          executeTimestamp,
          0, // OneTime
          null,
          null,
          memo || 'Scheduled payment via BlikPay',
          currentTime
        )
        .accounts({
          authority: publicKey,
          scheduledCharge: PublicKey.findProgramAddressSync(
            [
              Buffer.from('scheduled_charge'),
              publicKey.toBuffer(),
              recipientPubkey.toBuffer(),
              new anchor.BN(amountLamports).toArrayLike(Buffer, 'le', 8),
              new anchor.BN(executeTimestamp).toArrayLike(Buffer, 'le', 8),
              new Uint8Array([0]),
            ],
            programId
          )[0],
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc()

      onClose()
      // Reset form
      setRecipient('')
      setAmount('')
      setExecuteAt('')
      setMemo('')
    } catch (err: any) {
      console.error('Scheduled payment error:', err)
      setError(err.message || 'Failed to create scheduled payment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Schedule Payment
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

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
              Execute At
            </label>
            <input
              type="datetime-local"
              value={executeAt}
              onChange={(e) => setExecuteAt(e.target.value)}
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
              <Clock className="w-4 h-4" />
            )}
            Schedule Payment
          </Button>
        </form>
      </div>
    </div>
  )
}