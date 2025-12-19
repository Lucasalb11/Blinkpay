/**
 * Helius Webhook Handler
 * 
 * This endpoint receives transaction notifications from Helius
 * and reconciles payments with pending invoices.
 * 
 * Helius Webhook Setup:
 * 1. Create a webhook at https://dev.helius.xyz/webhooks
 * 2. Set the webhook URL to: https://your-domain.com/api/webhooks/helius
 * 3. Select "Enhanced Transaction" type
 * 4. Add the merchant wallet address(es) to monitor
 * 5. Copy the webhook secret and add to HELIUS_WEBHOOK_SECRET env
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { getHeliusWebhookSecret } from '@/lib/env';
import crypto from 'crypto';

// Helius Enhanced Transaction types
interface HeliusTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  fee: number;
  feePayer: string;
  nativeTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
  tokenTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }[];
  accountData?: {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: {
      userAccount: string;
      tokenAccount: string;
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
    }[];
  }[];
  instructions?: {
    programId: string;
    data: string;
    accounts: string[];
    innerInstructions: {
      programId: string;
      data: string;
      accounts: string[];
    }[];
  }[];
  events?: {
    nft?: unknown;
    swap?: unknown;
    compressed?: unknown;
  };
  type: string;
  source: string;
  description: string;
}

// Known token mints
const TOKEN_MINTS: Record<string, string> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo': 'PYUSD',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
};

// Verify Helius webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Extract memo from transaction
function extractMemo(tx: HeliusTransaction): string | null {
  const memoProgram = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
  
  for (const instruction of tx.instructions || []) {
    if (instruction.programId === memoProgram) {
      try {
        return Buffer.from(instruction.data, 'base64').toString('utf-8');
      } catch {
        return null;
      }
    }
    
    // Check inner instructions
    for (const innerIx of instruction.innerInstructions || []) {
      if (innerIx.programId === memoProgram) {
        try {
          return Buffer.from(innerIx.data, 'base64').toString('utf-8');
        } catch {
          return null;
        }
      }
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('helius-signature') || '';
    const webhookSecret = getHeliusWebhookSecret();

    // Verify signature if secret is configured
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const transactions: HeliusTransaction[] = JSON.parse(body);
    const supabase = createServerClient();

    // Process each transaction
    for (const tx of transactions) {
      console.log(`Processing transaction: ${tx.signature}`);

      // Extract memo to find invoice
      const memo = extractMemo(tx);
      
      // Process native SOL transfers
      for (const transfer of tx.nativeTransfers || []) {
        await processPayment(supabase, {
          signature: tx.signature,
          slot: tx.slot,
          timestamp: tx.timestamp,
          fromWallet: transfer.fromUserAccount,
          toWallet: transfer.toUserAccount,
          amount: transfer.amount / 1e9, // Convert lamports to SOL
          token: 'SOL',
          fee: tx.fee,
          memo,
        });
      }

      // Process SPL token transfers
      for (const transfer of tx.tokenTransfers || []) {
        const tokenSymbol = TOKEN_MINTS[transfer.mint];
        if (!tokenSymbol) continue; // Skip unknown tokens

        await processPayment(supabase, {
          signature: tx.signature,
          slot: tx.slot,
          timestamp: tx.timestamp,
          fromWallet: transfer.fromUserAccount,
          toWallet: transfer.toUserAccount,
          amount: transfer.tokenAmount,
          token: tokenSymbol,
          fee: tx.fee,
          memo,
        });
      }
    }

    return NextResponse.json({ success: true, processed: transactions.length });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface PaymentData {
  signature: string;
  slot: number;
  timestamp: number;
  fromWallet: string;
  toWallet: string;
  amount: number;
  token: string;
  fee: number;
  memo: string | null;
}

async function processPayment(
  supabase: ReturnType<typeof createServerClient>,
  payment: PaymentData
) {
  try {
    // Find merchant by wallet address
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('wallet_address', payment.toWallet)
      .single();

    if (!merchant) {
      console.log(`No merchant found for wallet: ${payment.toWallet}`);
      return;
    }

    // Log webhook event
    await supabase.from('webhook_events').insert({
      merchant_id: merchant.id,
      event_type: 'payment_received',
      payload: payment as unknown as Record<string, unknown>,
      processed: false,
    });

    // Find matching invoice
    let invoiceQuery = supabase
      .from('invoices')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('status', 'pending')
      .eq('token', payment.token);

    // If memo exists, try to match by memo first (most accurate)
    if (payment.memo) {
      const { data: invoiceByMemo } = await invoiceQuery
        .eq('memo', payment.memo)
        .single();

      if (invoiceByMemo) {
        await reconcileInvoice(supabase, invoiceByMemo.id, payment, merchant.id);
        return;
      }
    }

    // Fallback: Match by exact amount (less accurate but useful)
    const { data: invoicesByAmount } = await invoiceQuery
      .eq('amount', payment.amount)
      .order('created_at', { ascending: true })
      .limit(1);

    if (invoicesByAmount && invoicesByAmount.length > 0) {
      await reconcileInvoice(supabase, invoicesByAmount[0].id, payment, merchant.id);
      return;
    }

    // No matching invoice found - record as unmatched transaction
    await supabase.from('transactions').insert({
      merchant_id: merchant.id,
      invoice_id: null,
      type: 'payment',
      amount: payment.amount,
      token: payment.token as 'SOL' | 'USDC' | 'PYUSD' | 'USDT',
      signature: payment.signature,
      slot: payment.slot,
      block_time: new Date(payment.timestamp * 1000).toISOString(),
      fee_lamports: payment.fee,
      from_wallet: payment.fromWallet,
      to_wallet: payment.toWallet,
      raw_data: payment as unknown as Record<string, unknown>,
    });

    console.log(`Unmatched payment recorded: ${payment.signature}`);
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}

async function reconcileInvoice(
  supabase: ReturnType<typeof createServerClient>,
  invoiceId: string,
  payment: PaymentData,
  merchantId: string
) {
  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date(payment.timestamp * 1000).toISOString(),
      paid_amount: payment.amount,
      paid_token: payment.token as 'SOL' | 'USDC' | 'PYUSD' | 'USDT',
      payer_wallet: payment.fromWallet,
      transaction_signature: payment.signature,
    })
    .eq('id', invoiceId);

  // Record transaction
  await supabase.from('transactions').insert({
    merchant_id: merchantId,
    invoice_id: invoiceId,
    type: 'payment',
    amount: payment.amount,
    token: payment.token as 'SOL' | 'USDC' | 'PYUSD' | 'USDT',
    signature: payment.signature,
    slot: payment.slot,
    block_time: new Date(payment.timestamp * 1000).toISOString(),
    fee_lamports: payment.fee,
    from_wallet: payment.fromWallet,
    to_wallet: payment.toWallet,
    raw_data: payment as unknown as Record<string, unknown>,
  });

  // Mark webhook event as processed
  await supabase
    .from('webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('payload->signature', payment.signature);

  console.log(`Invoice ${invoiceId} reconciled with payment ${payment.signature}`);
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, helius-signature',
    },
  });
}
