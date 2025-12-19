/**
 * Solana Actions API Route for Payment Requests
 * 
 * Payment requests are targeted payment links sent to specific wallets/emails.
 * Unlike invoices, these are lighter-weight and focused on requesting money.
 * 
 * Use cases:
 * - Request payment from a client
 * - Split bills with friends
 * - Collect money for group purchases
 * - Freelancer payment collection
 * 
 * GET: Returns the request metadata
 * POST: Creates the split payment transaction
 * OPTIONS: CORS preflight
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/client';
import {
  createActionHeaders,
  getConnection,
  createSplitPaymentTransaction,
  serializeTransaction,
  formatTokenAmount,
  calculatePaymentBreakdown,
  BLINKPAY_PLATFORM_WALLET,
  type ActionGetResponse,
  type ActionPostResponse,
} from '@/lib/solana/actions';
import { APP_URL } from '@/lib/env';
import type { TokenType } from '@/types/database';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const ActionPostRequestSchema = z.object({
  account: z
    .string()
    .min(32)
    .max(44)
    .refine(
      (value) => {
        try {
          new PublicKey(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid Solana wallet address' }
    ),
});

const RouteParamsSchema = z.object({
  id: z.string().uuid('Invalid request ID format'),
});

// ============================================
// OPTIONS: CORS Preflight
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: createActionHeaders(),
  });
}

// ============================================
// GET: Return Request Metadata
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headers = createActionHeaders();

  try {
    // Validate ID format
    const paramValidation = RouteParamsSchema.safeParse({ id });
    if (!paramValidation.success) {
      const errorResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: 'Invalid Request',
        description: 'The payment request ID is invalid.',
        label: 'Error',
        disabled: true,
        error: { message: 'Invalid request ID' },
      };
      return NextResponse.json(errorResponse, { status: 400, headers });
    }

    const supabase = createServerClient();

    // Fetch payment request with merchant info
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        merchant:merchants(
          business_name,
          business_logo_url,
          wallet_address
        ),
        customer:customers(name, email)
      `)
      .eq('id', id)
      .single();

    // Handle: Request not found
    if (error || !paymentRequest) {
      const errorResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: 'Request Not Found',
        description: 'This payment request is invalid or has been deleted.',
        label: 'Not Found',
        disabled: true,
        error: { message: 'Payment request not found' },
      };
      return NextResponse.json(errorResponse, { status: 404, headers });
    }

    // Handle: Already paid
    if (paymentRequest.status === 'paid') {
      const paidResponse: ActionGetResponse = {
        icon: paymentRequest.merchant?.business_logo_url || `${APP_URL}/icon.png`,
        title: '✅ Already Paid',
        description: `This payment request (${paymentRequest.request_number}) has already been paid.\n\nThank you!`,
        label: 'Already Paid',
        disabled: true,
      };
      return NextResponse.json(paidResponse, { status: 200, headers });
    }

    // Handle: Cancelled
    if (paymentRequest.status === 'cancelled') {
      const cancelledResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: '❌ Request Cancelled',
        description: 'This payment request has been cancelled.',
        label: 'Cancelled',
        disabled: true,
      };
      return NextResponse.json(cancelledResponse, { status: 200, headers });
    }

    // Handle: Expired
    const isExpired = paymentRequest.expires_at && new Date(paymentRequest.expires_at) < new Date();
    if (paymentRequest.status === 'expired' || isExpired) {
      // Update status if not already expired
      if (paymentRequest.status !== 'expired' && isExpired) {
        await supabase
          .from('payment_requests')
          .update({ status: 'expired' })
          .eq('id', id);
      }

      const expiredResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: '⏰ Request Expired',
        description: 'This payment request has expired. Please contact the sender for a new link.',
        label: 'Expired',
        disabled: true,
      };
      return NextResponse.json(expiredResponse, { status: 200, headers });
    }

    // Update view tracking
    const updates: Record<string, unknown> = {
      view_count: (paymentRequest.view_count || 0) + 1,
    };

    if (!paymentRequest.first_viewed_at) {
      updates.first_viewed_at = new Date().toISOString();
      updates.status = 'viewed';
    }

    await supabase
      .from('payment_requests')
      .update(updates)
      .eq('id', id);

    // Build response
    const merchantName = paymentRequest.merchant?.business_name || 'BlinkPay User';
    const amount = Number(paymentRequest.amount);
    const token = paymentRequest.token as TokenType;
    const formattedAmount = formatTokenAmount(amount, token);

    // Build description
    const descriptionLines = [
      `${merchantName} is requesting a payment`,
      '',
      `📄 Request: ${paymentRequest.request_number}`,
      `💰 Amount: ${formattedAmount}`,
    ];

    if (paymentRequest.description) {
      descriptionLines.push('');
      descriptionLines.push(`📝 ${paymentRequest.description}`);
    }

    if (paymentRequest.recipient_name) {
      descriptionLines.push('');
      descriptionLines.push(`👤 To: ${paymentRequest.recipient_name}`);
    }

    const response: ActionGetResponse = {
      icon: paymentRequest.merchant?.business_logo_url || `${APP_URL}/icon.png`,
      title: `Payment Request from ${merchantName}`,
      description: descriptionLines.join('\n'),
      label: `Pay ${formattedAmount}`,
      links: {
        actions: [
          {
            label: `Pay ${formattedAmount}`,
            href: `${APP_URL}/api/actions/request/${id}`,
          },
        ],
      },
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Payment Request GET error:', error);
    const errorResponse: ActionGetResponse = {
      icon: `${APP_URL}/icon.png`,
      title: 'Error',
      description: 'An error occurred while loading this payment request.',
      label: 'Error',
      disabled: true,
      error: { message: 'Internal server error' },
    };
    return NextResponse.json(errorResponse, { status: 500, headers });
  }
}

// ============================================
// POST: Create Payment Transaction
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headers = createActionHeaders();

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Invalid JSON body' } },
        { status: 400, headers }
      );
    }

    // Validate with Zod
    const bodyValidation = ActionPostRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: { message: bodyValidation.error.errors[0]?.message || 'Invalid request' } },
        { status: 400, headers }
      );
    }

    // Validate request ID
    const paramValidation = RouteParamsSchema.safeParse({ id });
    if (!paramValidation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request ID' } },
        { status: 400, headers }
      );
    }

    const payerPubkey = new PublicKey(bodyValidation.data.account);
    const supabase = createServerClient();

    // Fetch payment request
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        merchant:merchants(wallet_address, business_name)
      `)
      .eq('id', id)
      .single();

    if (error || !paymentRequest) {
      return NextResponse.json(
        { error: { message: 'Payment request not found' } },
        { status: 404, headers }
      );
    }

    // Validate status
    if (paymentRequest.status === 'paid') {
      return NextResponse.json(
        { error: { message: 'This request has already been paid' } },
        { status: 400, headers }
      );
    }

    if (paymentRequest.status === 'cancelled') {
      return NextResponse.json(
        { error: { message: 'This request has been cancelled' } },
        { status: 400, headers }
      );
    }

    // Check expiry
    if (paymentRequest.expires_at && new Date(paymentRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: { message: 'This request has expired' } },
        { status: 400, headers }
      );
    }

    // Optional: Validate payer wallet matches recipient_wallet (if specified)
    if (paymentRequest.recipient_wallet) {
      const expectedPayer = new PublicKey(paymentRequest.recipient_wallet);
      if (!payerPubkey.equals(expectedPayer)) {
        // Allow payment from any wallet, but log the mismatch
        console.log(`Payment from different wallet. Expected: ${paymentRequest.recipient_wallet}, Got: ${payerPubkey.toString()}`);
      }
    }

    // Get merchant wallet
    const merchantWallet = paymentRequest.merchant?.wallet_address;
    if (!merchantWallet) {
      return NextResponse.json(
        { error: { message: 'Merchant wallet not configured' } },
        { status: 500, headers }
      );
    }

    const merchantPubkey = new PublicKey(merchantWallet);
    const amount = Number(paymentRequest.amount);
    const token = paymentRequest.token as TokenType;

    // Create split payment transaction
    const connection = getConnection();
    const transaction = await createSplitPaymentTransaction(connection, {
      payer: payerPubkey,
      merchant: merchantPubkey,
      platform: BLINKPAY_PLATFORM_WALLET,
      amount,
      token,
      memo: paymentRequest.memo || undefined,
    });

    // Serialize transaction
    const serializedTransaction = serializeTransaction(transaction);
    const breakdown = calculatePaymentBreakdown(amount, token);

    const response: ActionPostResponse = {
      transaction: serializedTransaction,
      message: `Payment Request ${paymentRequest.request_number} Paid Successfully!\n` +
        `Amount: ${formatTokenAmount(amount, token)}\n` +
        `To: ${paymentRequest.merchant?.business_name || 'Merchant'}`,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Payment Request POST error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create transaction' } },
      { status: 500, headers }
    );
  }
}
