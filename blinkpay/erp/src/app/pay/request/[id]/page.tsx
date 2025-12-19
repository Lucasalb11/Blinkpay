'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  ArrowRight,
  Shield,
  Zap,
  Send,
  User,
} from 'lucide-react';
import type { PaymentRequest, TokenType } from '@/types/database';

interface PaymentRequestWithMerchant extends PaymentRequest {
  merchant: {
    business_name: string;
    business_logo_url: string | null;
    wallet_address: string;
  } | null;
}

async function fetchPaymentRequest(id: string): Promise<PaymentRequestWithMerchant | null> {
  const { data } = await supabase
    .from('payment_requests')
    .select(`
      *,
      merchant:merchants(business_name, business_logo_url, wallet_address)
    `)
    .eq('id', id)
    .single();

  return data;
}

export default function PaymentRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['payment-request', id],
    queryFn: () => fetchPaymentRequest(id),
  });

  const handlePayment = async () => {
    if (!publicKey || !signTransaction || !request) return;

    setIsPaying(true);

    try {
      const response = await fetch(`/api/actions/request/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: publicKey.toString() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create transaction');
      }

      const { transaction: txBase64 } = await response.json();

      const transaction = Transaction.from(Buffer.from(txBase64, 'base64'));
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      setPaymentSuccess(true);
      toast({
        title: 'Payment successful!',
        description: `Transaction: ${signature.slice(0, 8)}...`,
        variant: 'success',
      });
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Request Not Found</CardTitle>
            <CardDescription>
              This payment request is invalid or has been deleted.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already paid
  if (paymentSuccess || request.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-green-200 bg-green-50">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 status-paid">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Payment Complete!</CardTitle>
            <CardDescription className="text-green-700">
              Thank you for your payment to {request.merchant?.business_name}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Request</span>
                <span className="font-medium">{request.request_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">
                  {formatCurrency(Number(request.paid_amount || request.amount), request.token)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cancelled
  if (request.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle>Request Cancelled</CardTitle>
            <CardDescription>
              This payment request has been cancelled.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Expired
  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
  if (request.status === 'expired' || isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle>Request Expired</CardTitle>
            <CardDescription>
              This payment request has expired. Please contact the sender for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const merchantName = request.merchant?.business_name || 'BlinkPay User';
  const token = request.token as TokenType;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-solana flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">
            Payment Request from {merchantName}
          </CardTitle>
          <CardDescription>
            {request.request_number}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount */}
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-gray-900">
              {formatCurrency(Number(request.amount), token)}
            </div>
            {request.description && (
              <p className="text-gray-600 mt-2">{request.description}</p>
            )}
          </div>

          {/* Request details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">From</span>
              <span className="font-medium">{merchantName}</span>
            </div>
            {request.recipient_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">To</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {request.recipient_name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <Badge variant="pending">
                <Clock className="w-3 h-3 mr-1" />
                {request.status === 'viewed' ? 'Viewed' : 'Pending'}
              </Badge>
            </div>
            {request.expires_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires</span>
                <span>{formatDate(request.expires_at)}</span>
              </div>
            )}
          </div>

          {/* Pay button */}
          {!connected ? (
            <div className="space-y-4">
              <WalletMultiButton
                style={{
                  width: '100%',
                  backgroundColor: 'hsl(221.2 83.2% 53.3%)',
                  height: '48px',
                  borderRadius: '0.5rem',
                  fontSize: '16px',
                  fontWeight: '500',
                  justifyContent: 'center',
                }}
              />
            </div>
          ) : (
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handlePayment}
              loading={isPaying}
            >
              {isPaying ? (
                'Processing...'
              ) : (
                <>
                  Pay {formatCurrency(Number(request.amount), token)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Instant</span>
            </div>
            <div className="flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              <span>Non-custodial</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
