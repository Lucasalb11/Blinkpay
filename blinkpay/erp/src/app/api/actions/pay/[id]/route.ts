/**
 * Solana Actions API Route for Invoice Payment
 * 
 * This endpoint serves Blinks (Blockchain Links) that can be unfurled
 * on Twitter/X, Dialect, and other compatible platforms.
 * 
 * GET: Returns the action metadata (icon, title, description, label)
 * POST: Creates and returns the split payment transaction for signing
 * OPTIONS: CORS preflight
 * 
 * Payment Split:
 * - 99.5% → Merchant Wallet
 * - 0.5%  → BlinkPay Platform Wallet
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
  PLATFORM_FEE_PERCENTAGE,
  type ActionGetResponse,
  type ActionPostResponse,
} from '@/lib/solana/actions';
import { APP_URL } from '@/lib/env';
import type { TokenType } from '@/types/database';

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Zod schema for POST request body validation
 */
const ActionPostRequestSchema = z.object({
  account: z
    .string()
    .min(32, 'Invalid wallet address')
    .max(44, 'Invalid wallet address')
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

/**
 * Zod schema for route params
 */
const RouteParamsSchema = z.object({
  id: z.string().uuid('Invalid invoice ID format'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate dynamic icon URL for the Blink
 * In production, this could be an API that generates branded images
 */
function getInvoiceIconUrl(merchantLogoUrl: string | null, invoiceNumber: string): string {
  // If merchant has a logo, use it
  if (merchantLogoUrl) {
    return merchantLogoUrl;
  }
  
  // Use a dynamic OG image generator (placeholder for now)
  // You could integrate with services like og-image.vercel.app or similar
  return `${APP_URL}/api/og/invoice?num=${encodeURIComponent(invoiceNumber)}`;
}

/**
 * Build invoice description with payment details
 */
function buildInvoiceDescription(
  description: string | null,
  invoiceNumber: string,
  amount: number,
  token: TokenType
): string {
  const breakdown = calculatePaymentBreakdown(amount, token);
  const feePercentage = (PLATFORM_FEE_PERCENTAGE * 100).toFixed(1);
  
  const lines = [
    description || 'Invoice Payment',
    '',
    `📄 Invoice: ${invoiceNumber}`,
    `💰 Amount: ${formatTokenAmount(amount, token)}`,
    `📊 Platform Fee: ${feePercentage}% (${formatTokenAmount(breakdown.platformFee, token)})`,
  ];
  
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

/**
 * GET /api/actions/pay/[id]
 * 
 * Returns Solana Actions metadata for Blink unfurling.
 * This is what Twitter/X and other platforms use to render the payment card.
 * 
 * Response format follows Solana Actions Spec v2.1.3:
 * {
 *   icon: "https://...",
 *   title: "Invoice #INV-2024-00001 - Acme Corp",
 *   description: "Web Design Services\n\nAmount: 100.00 USDC",
 *   label: "Pay 100.00 USDC"
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headers = createActionHeaders();

  try {
    // Validate invoice ID format
    const paramValidation = RouteParamsSchema.safeParse({ id });
    if (!paramValidation.success) {
      const errorResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: 'Invalid Invoice',
        description: 'The invoice ID format is invalid.',
        label: 'Error',
        disabled: true,
        error: { message: 'Invalid invoice ID' },
      };
      return NextResponse.json(errorResponse, { status: 400, headers });
    }

    const supabase = createServerClient();

    // Fetch invoice with merchant info
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        token,
        description,
        status,
        due_date,
        memo,
        created_at,
        merchant:merchants(
          business_name,
          business_logo_url,
          wallet_address
        )
      `)
      .eq('id', id)
      .single();

    // Handle: Invoice not found
    if (error || !invoice) {
      console.error('Invoice fetch error:', error);
      const errorResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: 'Invoice Not Found',
        description: 'This payment link is invalid or has expired.',
        label: 'Not Found',
        disabled: true,
        error: { message: 'Invoice not found' },
      };
      return NextResponse.json(errorResponse, { status: 404, headers });
    }

    // Handle: Invoice already paid
    if (invoice.status === 'paid') {
      const paidResponse: ActionGetResponse = {
        icon: getInvoiceIconUrl(
          invoice.merchant?.business_logo_url || null,
          invoice.invoice_number || ''
        ),
        title: '✅ Payment Complete',
        description: `Invoice ${invoice.invoice_number} has already been paid.\n\nThank you for your payment!`,
        label: 'Already Paid',
        disabled: true,
      };
      return NextResponse.json(paidResponse, { status: 200, headers });
    }

    // Handle: Invoice cancelled
    if (invoice.status === 'cancelled') {
      const cancelledResponse: ActionGetResponse = {
        icon: `${APP_URL}/icon.png`,
        title: '❌ Invoice Cancelled',
        description: 'This invoice has been cancelled by the merchant.',
        label: 'Cancelled',
        disabled: true,
      };
      return NextResponse.json(cancelledResponse, { status: 200, headers });
    }

    // Handle: Invoice overdue (still payable, but show warning)
    const isOverdue = invoice.status === 'overdue' || 
      (invoice.due_date && new Date(invoice.due_date) < new Date());

    // Build response
    const merchantName = invoice.merchant?.business_name || 'BlinkPay Merchant';
    const amount = Number(invoice.amount);
    const token = invoice.token as TokenType;
    const formattedAmount = formatTokenAmount(amount, token);

    const response: ActionGetResponse = {
      icon: getInvoiceIconUrl(
        invoice.merchant?.business_logo_url || null,
        invoice.invoice_number || ''
      ),
      title: `Invoice #${invoice.invoice_number} - ${merchantName}`,
      description: buildInvoiceDescription(
        invoice.description,
        invoice.invoice_number || '',
        amount,
        token
      ) + (isOverdue ? '\n\n⚠️ This invoice is overdue' : ''),
      label: `Pay ${formattedAmount}`,
      links: {
        actions: [
          {
            label: `Pay ${formattedAmount}`,
            href: `${APP_URL}/api/actions/pay/${id}`,
          },
        ],
      },
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Action GET error:', error);
    const errorResponse: ActionGetResponse = {
      icon: `${APP_URL}/icon.png`,
      title: 'Error',
      description: 'An error occurred while loading this payment.',
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

/**
 * POST /api/actions/pay/[id]
 * 
 * Creates a split payment transaction:
 * - 99.5% to Merchant Wallet
 * - 0.5% to BlinkPay Platform Wallet
 * 
 * Request body:
 * { "account": "<payer_public_key>" }
 * 
 * Response:
 * {
 *   "transaction": "<base64_encoded_tx>",
 *   "message": "Invoice #INV-2024-00001 Paid Successfully"
 * }
 */
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
      const errorMessage = bodyValidation.error.errors[0]?.message || 'Invalid request';
      return NextResponse.json(
        { error: { message: errorMessage } },
        { status: 400, headers }
      );
    }

    // Validate invoice ID
    const paramValidation = RouteParamsSchema.safeParse({ id });
    if (!paramValidation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid invoice ID' } },
        { status: 400, headers }
      );
    }

    // Parse payer public key (already validated by Zod)
    const payerPubkey = new PublicKey(bodyValidation.data.account);

    const supabase = createServerClient();

    // Fetch invoice with merchant info
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        token,
        description,
        status,
        memo,
        merchant:merchants(
          wallet_address,
          business_name
        )
      `)
      .eq('id', id)
      .single();

    // Handle: Invoice not found
    if (error || !invoice) {
      console.error('Invoice fetch error:', error);
      return NextResponse.json(
        { error: { message: 'Invoice not found' } },
        { status: 404, headers }
      );
    }

    // Handle: Invoice already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: { message: 'This invoice has already been paid' } },
        { status: 400, headers }
      );
    }

    // Handle: Invoice cancelled
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: { message: 'This invoice has been cancelled' } },
        { status: 400, headers }
      );
    }

    // Validate merchant wallet
    const merchantWallet = invoice.merchant?.wallet_address;
    if (!merchantWallet) {
      console.error('Merchant wallet not configured for invoice:', id);
      return NextResponse.json(
        { error: { message: 'Merchant wallet not configured' } },
        { status: 500, headers }
      );
    }

    // Parse values
    const merchantPubkey = new PublicKey(merchantWallet);
    const amount = Number(invoice.amount);
    const token = invoice.token as TokenType;

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { message: 'Invalid invoice amount' } },
        { status: 400, headers }
      );
    }

    // Create split payment transaction
    const connection = getConnection();
    
    const transaction = await createSplitPaymentTransaction(connection, {
      payer: payerPubkey,
      merchant: merchantPubkey,
      platform: BLINKPAY_PLATFORM_WALLET,
      amount,
      token,
      memo: invoice.memo || undefined, // Include memo for reconciliation
    });

    // Serialize transaction
    const serializedTransaction = serializeTransaction(transaction);

    // Calculate breakdown for message
    const breakdown = calculatePaymentBreakdown(amount, token);

    // Build response
    const response: ActionPostResponse = {
      transaction: serializedTransaction,
      message: `Invoice #${invoice.invoice_number} Paid Successfully\n` +
        `Amount: ${formatTokenAmount(amount, token)}\n` +
        `Merchant: ${formatTokenAmount(breakdown.merchantAmount, token)}\n` +
        `Platform Fee: ${formatTokenAmount(breakdown.platformFee, token)}`,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error('Action POST error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        return NextResponse.json(
          { error: { message: 'Insufficient balance to complete payment' } },
          { status: 400, headers }
        );
      }
      if (error.message.includes('blockhash')) {
        return NextResponse.json(
          { error: { message: 'Network error. Please try again.' } },
          { status: 503, headers }
        );
      }
    }

    return NextResponse.json(
      { error: { message: 'Failed to create transaction. Please try again.' } },
      { status: 500, headers }
    );
  }
}
