'use client';

import { use, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
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
} from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/database';

interface InvoiceWithMerchant extends Invoice {
  merchant: {
    business_name: string;
    business_logo_url: string | null;
    wallet_address: string;
  } | null;
}

async function fetchInvoice(id: string): Promise<InvoiceWithMerchant | null> {
  const { data } = await supabase
    .from('invoices')
    .select(`
      *,
      merchant:merchants(business_name, business_logo_url, wallet_address)
    `)
    .eq('id', id)
    .single();

  return data;
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id),
  });

  const handlePayment = async () => {
    if (!publicKey || !signTransaction || !invoice) return;

    setIsPaying(true);

    try {
      // Call our API to get the transaction
      const response = await fetch(`/api/actions/pay/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: publicKey.toString() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create transaction');
      }

      const { transaction: txBase64, message } = await response.json();

      // Decode and sign the transaction
      const transaction = Transaction.from(Buffer.from(txBase64, 'base64'));
      const signedTx = await signTransaction(transaction);

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or not found
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              This payment link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess || invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-green-200 bg-green-50">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 status-paid">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Payment Complete!</CardTitle>
            <CardDescription className="text-green-700">
              Thank you for your payment to {invoice.merchant?.business_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">
                  {formatCurrency(Number(invoice.paid_amount || invoice.amount), invoice.token)}
                </span>
              </div>
              {invoice.transaction_signature && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction</span>
                  <a
                    href={`https://solscan.io/tx/${invoice.transaction_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {invoice.transaction_signature.slice(0, 8)}...
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cancelled state
  if (invoice.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle>Invoice Cancelled</CardTitle>
            <CardDescription>
              This invoice has been cancelled by the merchant.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Payment form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Merchant logo/name */}
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-solana flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">
            Pay {invoice.merchant?.business_name || 'Merchant'}
          </CardTitle>
          <CardDescription>
            Invoice {invoice.invoice_number}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount display */}
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-gray-900">
              {formatCurrency(Number(invoice.amount), invoice.token)}
            </div>
            {invoice.description && (
              <p className="text-gray-600 mt-2">{invoice.description}</p>
            )}
          </div>

          {/* Invoice details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <Badge
                variant={invoice.status === 'overdue' ? 'overdue' : 'pending'}
              >
                <Clock className="w-3 h-3 mr-1" />
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            {invoice.due_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date</span>
                <span className="font-medium">{formatDate(invoice.due_date)}</span>
              </div>
            )}
          </div>

          {/* Connect wallet or pay button */}
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
              <p className="text-center text-sm text-gray-500">
                Connect your Solana wallet to pay
              </p>
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
                  Pay {formatCurrency(Number(invoice.amount), invoice.token)}
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
