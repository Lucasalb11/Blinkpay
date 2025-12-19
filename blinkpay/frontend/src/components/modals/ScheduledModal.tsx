'use client'

import { FC, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Calendar, Clock, Loader2, Repeat } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Button } from '@/components/ui/Button'
import { SOL_MINT, PYUSD_MINT, UI_CONSTANTS } from '@/lib/config'
import { useBlikPay } from '@/lib/blinkpay'

interface ScheduledModalProps {
  isOpen: boolean
  onClose: () => void
}

type ChargeType = 'OneTime' | 'Recurring'
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const ScheduledModal: FC<ScheduledModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet()
  const { getClient } = useBlikPay()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenType, setTokenType] = useState<'SOL' | 'PYUSD'>('SOL')
  const [chargeType, setChargeType] = useState<ChargeType>('OneTime')
  const [executeDate, setExecuteDate] = useState<Date | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [maxExecutions, setMaxExecutions] = useState('')
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

      // Validate recipient address
      let recipientPubkey: PublicKey
      try {
        recipientPubkey = new PublicKey(recipient)
      } catch {
        toast.error('Invalid recipient address')
        return
      }

      // Validate amount
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Invalid amount')
        return
      }

      // Validate date
      if (!executeDate) {
        toast.error('Please select execution date and time')
        return
      }

      const executeAt = Math.floor(executeDate.getTime() / 1000)
      const currentTime = Math.floor(Date.now() / 1000)

      if (executeAt <= currentTime) {
        toast.error('Execution time must be in the future')
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

      // Calculate interval seconds for recurring charges
      let intervalSeconds: number | undefined
      let maxExec: number | undefined

      if (chargeType === 'Recurring') {
        switch (frequency) {
          case 'daily':
            intervalSeconds = 24 * 60 * 60 // 1 day
            break
          case 'weekly':
            intervalSeconds = 7 * 24 * 60 * 60 // 1 week
            break
          case 'monthly':
            intervalSeconds = 30 * 24 * 60 * 60 // ~1 month
            break
          case 'yearly':
            intervalSeconds = 365 * 24 * 60 * 60 // ~1 year
            break
        }

        if (maxExecutions) {
          maxExec = parseInt(maxExecutions)
          if (isNaN(maxExec) || maxExec <= 0) {
            toast.error('Invalid maximum executions')
            return
          }
        }
      }

      // Validate memo
      if (memo.length > UI_CONSTANTS.MAX_MEMO_LENGTH) {
        toast.error(`Memo too long (max ${UI_CONSTANTS.MAX_MEMO_LENGTH} characters)`)
        return
      }

      const client = getClient()
      const tokenMint = tokenType === 'SOL' ? SOL_MINT : PYUSD_MINT

      const tx = await client.createScheduledCharge({
        amount: amountLamports,
        tokenMint,
        recipient: recipientPubkey,
        executeAt,
        chargeType,
        intervalSeconds,
        maxExecutions: maxExec,
        memo: memo.trim(),
      })

      toast.success('Scheduled charge created successfully!')
      console.log('Transaction:', tx)

      // Reset form
      setRecipient('')
      setAmount('')
      setExecuteDate(null)
      setMaxExecutions('')
      setMemo('')
      onClose()

    } catch (error: any) {
      console.error('Scheduled charge error:', error)
      toast.error(error.message || 'Failed to create scheduled charge')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Schedule Payment
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
                  Amount per Payment
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

            {/* Charge Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Payment Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="OneTime"
                    checked={chargeType === 'OneTime'}
                    onChange={(e) => setChargeType(e.target.value as ChargeType)}
                    className="mr-2"
                  />
                  <Clock className="w-4 h-4 mr-1" />
                  One-time
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Recurring"
                    checked={chargeType === 'Recurring'}
                    onChange={(e) => setChargeType(e.target.value as ChargeType)}
                    className="mr-2"
                  />
                  <Repeat className="w-4 h-4 mr-1" />
                  Recurring
                </label>
              </div>
            </div>

            {/* Date/Time Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {chargeType === 'OneTime' ? 'Execution Date & Time' : 'First Execution Date & Time'}
              </label>
              <div className="relative">
                <DatePicker
                  selected={executeDate}
                  onChange={setExecuteDate}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  placeholderText="Select date and time..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Recurring Options */}
            {chargeType === 'Recurring' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Executions (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxExecutions}
                    onChange={(e) => setMaxExecutions(e.target.value)}
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Payment description..."
                rows={2}
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule Payment
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