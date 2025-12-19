/**
 * Solana Actions API Route for Payment Links (Instant Payments)
 * 
 * This endpoint serves reusable payment Blinks that don't require invoices.
 * Perfect for:
 * - Tip jars
 * - Donations
 * - Quick payments
 * - Subscription-style recurring payments
 * 
 * GET: Returns the action metadata with optional amount input
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
import type { TokenType, PaymentLinkType } from '@/types/database';

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
  data: z.object({
    amount: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    message: z.string().max(280).optional(),
  }).optional(),
});

// ============================================
// HELPERS
// ============================================

function buildLinkDescription(
  link: {
    description: string | null;
    link_type: PaymentLinkType;
    fixed_amount: number | null;
    min_amount: number | null;
    max_amount: number | null;
    token: TokenType;
    payment_count: number;
  }
): string {
  const lines: string[] = [];

  if (link.description) {
    lines.push(link.description);
    lines.push('');
  }

  if (link.link_type === 'instant' && link.fixed_amount) {
    lines.push(`💰 Amount: ${formatTokenAmount(link.fixed_amount, link.token)}`);
  } else if (link.link_type === 'donation') {
    lines.push('💝 Choose your amount');
    if (link.min_amount) {
      lines.push(`   Min: ${formatTokenAmount(link.min_amount, link.token)}`);
    }
    if (link.max_amount) {
      lines.push(`   Max: ${formatTokenAmount(link.max_amount, link.token)}`);
    }
  }

  if (link.payment_count > 0) {
    lines.push(`✨ ${link.payment_count} payments received`);
  }

  return lines.join('\n');
}

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
// GET: Return Blink Metadata
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const headers = createActionHeaders();

  try {
    const supabase = createServerClient();

    // Fetch payment link with merchant info
    const { data: link, error } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(
          business_name,
          business_logo_url,
          wallet_address
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    // Handle: Link not found
    if (error || !link) {
      const errorResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: 'Payment Link Not Found',
        description: 'This payment link is invalid or has been deactivated.',
        label: 'Not Found',
        disabled: true,
        error: { message: 'Payment link not found' },
      };
      return NextResponse.json(errorResponse, { status: 404, headers });
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      const expiredResponse: ActionGetResponse = {
        icon: link.image_url || `${APP_URL}/icon.png`,
        title: 'Link Expired',
        description: 'This payment link has expired.',
        label: 'Expired',
        disabled: true,
      };
      return NextResponse.json(expiredResponse, { status: 200, headers });
    }

    // Check max payments
    if (link.max_payments && link.payment_count >= link.max_payments) {
      const maxedResponse: ActionGetResponse = {
        icon: link.image_url || `${APP_URL}/icon.png`,
        title: 'Payment Limit Reached',
        description: 'This payment link has reached its maximum number of payments.',
        label: 'Limit Reached',
        disabled: true,
      };
      return NextResponse.json(maxedResponse, { status: 200, headers });
    }

    // Increment view count
    await supabase
      .from('payment_links')
      .update({ view_count: (link.view_count || 0) + 1 })
      .eq('id', link.id);

    // Build response based on link type
    const merchantName = link.merchant?.business_name || 'BlinkPay';
    const title = link.title || `Pay ${merchantName}`;
    const token = link.token as TokenType;

    // For fixed amount links
    if (link.link_type === 'instant' && link.fixed_amount) {
      const formattedAmount = formatTokenAmount(link.fixed_amount, token);
      
      const response: ActionGetResponse = {
        icon: link.image_url || link.merchant?.business_logo_url || `${APP_URL}/icon.png`,
        title,
        description: buildLinkDescription(link),
        label: `Pay ${formattedAmount}`,
        links: {
          actions: [
            {
              label: `Pay ${formattedAmount}`,
              href: `${APP_URL}/api/actions/link/${slug}`,
            },
          ],
        },
      };
      return NextResponse.json(response, { status: 200, headers });
    }

    // For variable amount (donation) links
    const suggestedAmounts = link.suggested_amounts || [5, 10, 25, 50];
    const actions = suggestedAmounts.map((amount) => ({
      label: `${amount} ${token}`,
      href: `${APP_URL}/api/actions/link/${slug}?amount=${amount}`,
    }));

    // Add custom amount option
    actions.push({
      label: 'Custom Amount',
      href: `${APP_URL}/api/actions/link/${slug}?amount={amount}`,
      parameters: [
        {
          name: 'amount',
          label: `Amount (${token})`,
          required: true,
        },
      ],
    });

    const response: ActionGetResponse = {
      icon: link.image_url || link.merchant?.business_logo_url || `${APP_URL}/icon.png`,
      title,
      description: buildLinkDescription(link),
      label: 'Choose Amount',
      links: { actions },
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Payment Link GET error:', error);
    const errorResponse: ActionGetResponse = {
      icon: `${APP_URL}/icon.png`,
      title: 'Error',
      description: 'An error occurred while loading this payment link.',
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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const headers = createActionHeaders();

  try {
    // Get amount from query params (for variable amount links)
    const url = new URL(request.url);
    const amountParam = url.searchParams.get('amount');

    // Parse request body
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
    const validation = ActionPostRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: validation.error.errors[0]?.message || 'Invalid request' } },
        { status: 400, headers }
      );
    }

    const payerPubkey = new PublicKey(validation.data.account);
    const supabase = createServerClient();

    // Fetch payment link
    const { data: link, error } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(wallet_address, business_name)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { error: { message: 'Payment link not found' } },
        { status: 404, headers }
      );
    }

    // Validate expiry and limits
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: { message: 'This payment link has expired' } },
        { status: 400, headers }
      );
    }

    if (link.max_payments && link.payment_count >= link.max_payments) {
      return NextResponse.json(
        { error: { message: 'This payment link has reached its limit' } },
        { status: 400, headers }
      );
    }

    // Determine amount
    let amount: number;
    
    if (link.fixed_amount) {
      amount = Number(link.fixed_amount);
    } else if (amountParam) {
      amount = parseFloat(amountParam);
    } else if (validation.data.data?.amount) {
      amount = parseFloat(validation.data.data.amount);
    } else {
      return NextResponse.json(
        { error: { message: 'Amount is required for this payment link' } },
        { status: 400, headers }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { message: 'Invalid payment amount' } },
        { status: 400, headers }
      );
    }

    if (link.min_amount && amount < Number(link.min_amount)) {
      return NextResponse.json(
        { error: { message: `Minimum amount is ${link.min_amount} ${link.token}` } },
        { status: 400, headers }
      );
    }

    if (link.max_amount && amount > Number(link.max_amount)) {
      return NextResponse.json(
        { error: { message: `Maximum amount is ${link.max_amount} ${link.token}` } },
        { status: 400, headers }
      );
    }

    // Get merchant wallet
    const merchantWallet = link.merchant?.wallet_address;
    if (!merchantWallet) {
      return NextResponse.json(
        { error: { message: 'Merchant wallet not configured' } },
        { status: 500, headers }
      );
    }

    const merchantPubkey = new PublicKey(merchantWallet);
    const token = link.token as TokenType;

    // Create memo for reconciliation
    const memo = `LINK-${link.slug}`;

    // Create split payment transaction
    const connection = getConnection();
    const transaction = await createSplitPaymentTransaction(connection, {
      payer: payerPubkey,
      merchant: merchantPubkey,
      platform: BLINKPAY_PLATFORM_WALLET,
      amount,
      token,
      memo,
    });

    // Serialize transaction
    const serializedTransaction = serializeTransaction(transaction);
    const breakdown = calculatePaymentBreakdown(amount, token);

    const response: ActionPostResponse = {
      transaction: serializedTransaction,
      message: `Payment of ${formatTokenAmount(amount, token)} to ${link.merchant?.business_name || 'Merchant'} completed!`,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Payment Link POST error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create transaction' } },
      { status: 500, headers }
    );
  }
}
