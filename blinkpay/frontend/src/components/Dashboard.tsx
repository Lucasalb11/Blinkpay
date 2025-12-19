'use client'

import { FC, useState, useEffect } from 'react'
import { Send, FileText, Calendar, Wallet, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/Button'
import { WalletButton } from '@/components/WalletButton'
import { PaymentModal } from '@/components/modals/PaymentModal'
import { RequestModal } from '@/components/modals/RequestModal'
import { ScheduledModal } from '@/components/modals/ScheduledModal'
import { useBlinkPay, type PaymentRequest, type ScheduledCharge } from '@/lib/blinkpay'
import toast from 'react-hot-toast'

export const Dashboard: FC = () => {
  const { publicKey } = useWallet()
  const { getClient } = useBlinkPay()

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [scheduledModalOpen, setScheduledModalOpen] = useState(false)

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [scheduledCharges, setScheduledCharges] = useState<ScheduledCharge[]>([])
  const [pendingRequestsToPay, setPendingRequestsToPay] = useState<PaymentRequest[]>([])
  const [executableCharges, setExecutableCharges] = useState<ScheduledCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user data
  useEffect(() => {
    if (!publicKey) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        const client = getClient()

        const [
          userRequests,
          userCharges,
          requestsToPay,
          chargesToExecute,
        ] = await Promise.all([
          client.getUserPaymentRequests(publicKey),
          client.getUserScheduledCharges(publicKey),
          client.getPendingRequestsToPay(publicKey),
          client.getExecutableScheduledCharges(),
        ])

        setPaymentRequests(userRequests)
        setScheduledCharges(userCharges)
        setPendingRequestsToPay(requestsToPay)
        setExecutableCharges(chargesToExecute)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [publicKey, getClient])

  const handlePayRequest = async (request: PaymentRequest) => {
    try {
      const client = getClient()
      // TODO: Get the actual PDA for this request
      // For now, we'll need to derive it or store it
      toast.error('Pay request functionality coming soon')
    } catch (error: any) {
      toast.error(error.message || 'Failed to pay request')
    }
  }

  const handleExecuteCharge = async (charge: ScheduledCharge) => {
    try {
      const client = getClient()
      // TODO: Get the actual PDA for this charge
      toast.error('Execute charge functionality coming soon')
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute charge')
    }
  }

  const formatAmount = (amount: number, isSol: boolean) => {
    const formatted = isSol ? (amount / 1e9).toFixed(4) : (amount / 1e6).toFixed(2)
    return `${formatted} ${isSol ? 'SOL' : 'PYUSD'}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
      case 'Paid':
      case 'Executed': return 'text-green-500 bg-green-100 dark:bg-green-900/20'
      case 'Cancelled': return 'text-red-500 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (!publicKey) {
    return <div>Please connect your wallet</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                BlinkPay
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Dashboard
                </span>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center justify-center gap-3 h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Send Payment</div>
                <div className="text-xs opacity-90">Direct transfer</div>
              </div>
            </Button>

            <Button
              onClick={() => setRequestModalOpen(true)}
              variant="outline"
              className="flex items-center justify-center gap-3 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            >
              <FileText className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Request Payment</div>
                <div className="text-xs opacity-75">Create payment link</div>
              </div>
            </Button>

            <Button
              onClick={() => setScheduledModalOpen(true)}
              variant="outline"
              className="flex items-center justify-center gap-3 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10"
            >
              <Calendar className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Schedule Payment</div>
                <div className="text-xs opacity-75">Automated payments</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {paymentRequests.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Scheduled Charges
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scheduledCharges.length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending to Pay
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingRequestsToPay.length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ready to Execute
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {executableCharges.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Payment Requests
              </h3>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : paymentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No payment requests yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Create your first payment request to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentRequests.slice(0, 5).map((request, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatAmount(request.amount, request.tokenMint.toString() === '11111111111111111111111111111112')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.memo || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scheduled Charges */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Scheduled Charges
              </h3>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                </div>
              ) : scheduledCharges.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No scheduled charges yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Schedule your first automated payment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledCharges.slice(0, 5).map((charge, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatAmount(charge.amount, charge.tokenMint.toString() === '11111111111111111111111111111112')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(charge.status)}`}>
                            {charge.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {charge.chargeType} • {charge.memo || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Next: {formatDate(charge.executeAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {(pendingRequestsToPay.length > 0 || executableCharges.length > 0) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending Actions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Requests to Pay */}
              {pendingRequestsToPay.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      Requests to Pay
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {pendingRequestsToPay.slice(0, 3).map((request, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatAmount(request.amount, request.tokenMint.toString() === '11111111111111111111111111111112')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {request.memo || 'No description'}
                            </p>
                          </div>
                          <Button
                            onClick={() => handlePayRequest(request)}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            Pay Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Executable Charges */}
              {executableCharges.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Ready to Execute
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {executableCharges.slice(0, 3).map((charge, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatAmount(charge.amount, charge.tokenMint.toString() === '11111111111111111111111111111112')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {charge.memo || 'No description'}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleExecuteCharge(charge)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Execute
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
      <ScheduledModal
        isOpen={scheduledModalOpen}
        onClose={() => setScheduledModalOpen(false)}
      />
    </div>
  )
}