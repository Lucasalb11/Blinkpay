'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Wallet,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  XCircle,
} from 'lucide-react';
import type { PaymentLink, TokenType } from '@/types/database';

interface PaymentLinkWithMerchant extends PaymentLink {
  merchant: {
    business_name: string;
    business_logo_url: string | null;
    wallet_address: string;
  } | null;
}

async function fetchPaymentLink(slug: string): Promise<PaymentLinkWithMerchant | null> {
  const { data } = await supabase
    .from('payment_links')
    .select(`
      *,
      merchant:merchants(business_name, business_logo_url, wallet_address)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return data;
}

export default function PaymentLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const { data: link, isLoading, error } = useQuery({
    queryKey: ['payment-link', slug],
    queryFn: () => fetchPaymentLink(slug),
  });

  const handlePayment = async (amount: number) => {
    if (!publicKey || !signTransaction || !link) return;

    setIsPaying(true);

    try {
      // Build the URL with amount for variable links
      let url = `/api/actions/link/${slug}`;
      if (!link.fixed_amount) {
        url += `?amount=${amount}`;
      }

      const response = await fetch(url, {
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

  // Not found or expired
  if (error || !link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle>Link Not Found</CardTitle>
            <CardDescription>
              This payment link is invalid or has been deactivated.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>This payment link has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-green-200 bg-green-50">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 status-paid">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Payment Complete!</CardTitle>
            <CardDescription className="text-green-700">
              {link.success_message || `Thank you for your payment to ${link.merchant?.business_name}!`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const merchantName = link.merchant?.business_name || 'BlinkPay';
  const token = link.token as TokenType;
  const suggestedAmounts = link.suggested_amounts || [5, 10, 25, 50];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-solana flex items-center justify-center mb-4">
            {link.link_type === 'donation' ? (
              <Heart className="w-8 h-8 text-white" />
            ) : (
              <Zap className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-xl">
            {link.title || `Pay ${merchantName}`}
          </CardTitle>
          {link.description && (
            <CardDescription>{link.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fixed amount display */}
          {link.fixed_amount && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900">
                {formatCurrency(Number(link.fixed_amount), token)}
              </div>
            </div>
          )}

          {/* Variable amount selection */}
          {!link.fixed_amount && (
            <div className="space-y-4">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={customAmount === String(amount) ? 'default' : 'outline'}
                    onClick={() => setCustomAmount(String(amount))}
                    className="h-12"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom">Custom Amount ({token})</Label>
                <Input
                  id="custom"
                  type="number"
                  step="0.01"
                  min={link.min_amount || 0.01}
                  max={link.max_amount || undefined}
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          {link.payment_count > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              ✨ {link.payment_count} payments received
            </div>
          )}

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
              onClick={() => {
                const amount = link.fixed_amount || parseFloat(customAmount);
                if (!amount || amount <= 0) {
                  toast({ title: 'Please enter an amount', variant: 'destructive' });
                  return;
                }
                handlePayment(amount);
              }}
              loading={isPaying}
            >
              {isPaying ? (
                'Processing...'
              ) : (
                <>
                  Pay {link.fixed_amount 
                    ? formatCurrency(Number(link.fixed_amount), token)
                    : customAmount 
                      ? formatCurrency(parseFloat(customAmount), token)
                      : token}
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
