/**
 * Solana Actions Utilities
 * Core transaction engine for BlinkPay payment processing
 * 
 * Features:
 * - Split payment support (merchant + platform fee)
 * - SOL and SPL token transfers
 * - Automatic ATA creation
 * - Memo instruction for invoice reconciliation
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token';
import { TOKEN_MINTS, TOKEN_DECIMALS, type SupportedToken, SOLANA_RPC_URL } from '@/lib/env';

// ============================================
// CONSTANTS
// ============================================

/**
 * BlinkPay Platform Wallet Address
 * Receives 0.5% platform fee from all transactions
 * 
 * IMPORTANT: Replace with actual platform wallet before mainnet deployment
 */
export const BLINKPAY_PLATFORM_WALLET = new PublicKey(
  'BLiNKPAYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // TODO: Replace with actual platform wallet
);

/**
 * Platform fee percentage (0.5% = 0.005)
 */
export const PLATFORM_FEE_PERCENTAGE = 0.005;

/**
 * Merchant percentage (99.5% = 0.995)
 */
export const MERCHANT_PERCENTAGE = 1 - PLATFORM_FEE_PERCENTAGE;

/**
 * Memo Program ID for transaction tagging
 */
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// ============================================
// TYPES
// ============================================

/**
 * Solana Actions GET Response (per Blink spec v2.1.3)
 */
export interface ActionGetResponse {
  icon: string;
  title: string;
  description: string;
  label: string;
  disabled?: boolean;
  links?: {
    actions: ActionLink[];
  };
  error?: ActionError;
}

export interface ActionLink {
  label: string;
  href: string;
  parameters?: ActionParameter[];
}

export interface ActionParameter {
  name: string;
  label?: string;
  required?: boolean;
}

/**
 * Solana Actions POST Request
 */
export interface ActionPostRequest {
  account: string;
}

/**
 * Solana Actions POST Response
 */
export interface ActionPostResponse {
  transaction: string; // base64 encoded serialized transaction
  message?: string;
}

export interface ActionError {
  message: string;
}

/**
 * Split payment configuration
 */
export interface SplitPaymentConfig {
  /** Payer wallet (transaction signer) */
  payer: PublicKey;
  /** Merchant wallet (receives 99.5%) */
  merchant: PublicKey;
  /** Platform wallet (receives 0.5%) */
  platform: PublicKey;
  /** Total payment amount */
  amount: number;
  /** Token type (SOL, USDC, etc.) */
  token: SupportedToken;
  /** Optional memo for invoice reconciliation */
  memo?: string;
}

/**
 * Payment breakdown after fee calculation
 */
export interface PaymentBreakdown {
  totalAmount: number;
  merchantAmount: number;
  platformFee: number;
  token: SupportedToken;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create CORS headers for Solana Actions compliance
 */
export function createActionHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Encoding');
  headers.set('Access-Control-Expose-Headers', 'X-Action-Version, X-Blockchain-Ids');
  headers.set('X-Action-Version', '2.1.3');
  headers.set('X-Blockchain-Ids', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'); // mainnet
  headers.set('Content-Type', 'application/json');
  return headers;
}

/**
 * Get Solana connection instance
 */
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, 'confirmed');
}

/**
 * Convert token amount to smallest unit (lamports for SOL, raw units for SPL)
 */
export function toSmallestUnit(amount: number, token: SupportedToken): bigint {
  const decimals = TOKEN_DECIMALS[token];
  return BigInt(Math.round(amount * Math.pow(10, decimals)));
}

/**
 * Convert smallest unit back to token amount
 */
export function fromSmallestUnit(amount: bigint, token: SupportedToken): number {
  const decimals = TOKEN_DECIMALS[token];
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Calculate payment breakdown with platform fee
 */
export function calculatePaymentBreakdown(
  totalAmount: number,
  token: SupportedToken
): PaymentBreakdown {
  const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
  const merchantAmount = totalAmount * MERCHANT_PERCENTAGE;

  return {
    totalAmount,
    merchantAmount,
    platformFee,
    token,
  };
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number, token: SupportedToken): string {
  const decimals = token === 'SOL' ? 4 : 2;
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${token}`;
}

/**
 * Create memo instruction
 */
function createMemoInstruction(memo: string): TransactionInstruction {
  return {
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf-8'),
  };
}

// ============================================
// SOL TRANSFER FUNCTIONS
// ============================================

/**
 * Create SOL transfer instruction
 */
function createSolTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amountSol: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
  });
}

/**
 * Create split SOL transfer transaction
 * - Instruction A: 99.5% to merchant
 * - Instruction B: 0.5% to platform
 */
async function createSplitSolTransaction(
  connection: Connection,
  config: SplitPaymentConfig
): Promise<Transaction> {
  const transaction = new Transaction();
  const breakdown = calculatePaymentBreakdown(config.amount, 'SOL');

  // Instruction A: Transfer to Merchant (99.5%)
  transaction.add(
    createSolTransferInstruction(config.payer, config.merchant, breakdown.merchantAmount)
  );

  // Instruction B: Transfer to Platform (0.5%)
  transaction.add(
    createSolTransferInstruction(config.payer, config.platform, breakdown.platformFee)
  );

  // Optional: Add memo for invoice reconciliation
  if (config.memo) {
    transaction.add(createMemoInstruction(config.memo));
  }

  // Set transaction metadata
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = config.payer;

  return transaction;
}

// ============================================
// SPL TOKEN TRANSFER FUNCTIONS
// ============================================

/**
 * Check if an Associated Token Account exists
 */
async function checkAtaExists(
  connection: Connection,
  ata: PublicKey
): Promise<boolean> {
  try {
    await getAccount(connection, ata);
    return true;
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return false;
    }
    throw error;
  }
}

/**
 * Create split SPL token transfer transaction
 * - Creates ATAs if they don't exist
 * - Instruction A: 99.5% to merchant
 * - Instruction B: 0.5% to platform
 */
async function createSplitSplTransaction(
  connection: Connection,
  config: SplitPaymentConfig
): Promise<Transaction> {
  const transaction = new Transaction();
  const mintPubkey = new PublicKey(TOKEN_MINTS[config.token]);
  const breakdown = calculatePaymentBreakdown(config.amount, config.token);

  // Get Associated Token Addresses
  const payerAta = await getAssociatedTokenAddress(
    mintPubkey,
    config.payer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const merchantAta = await getAssociatedTokenAddress(
    mintPubkey,
    config.merchant,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const platformAta = await getAssociatedTokenAddress(
    mintPubkey,
    config.platform,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Check and create ATAs if needed (payer pays for creation)
  const [merchantAtaExists, platformAtaExists] = await Promise.all([
    checkAtaExists(connection, merchantAta),
    checkAtaExists(connection, platformAta),
  ]);

  // Create Merchant ATA if needed
  if (!merchantAtaExists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        config.payer,
        merchantAta,
        config.merchant,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Create Platform ATA if needed
  if (!platformAtaExists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        config.payer,
        platformAta,
        config.platform,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Calculate amounts in smallest units
  const merchantAmountRaw = toSmallestUnit(breakdown.merchantAmount, config.token);
  const platformAmountRaw = toSmallestUnit(breakdown.platformFee, config.token);

  // Instruction A: Transfer to Merchant (99.5%)
  transaction.add(
    createTransferInstruction(
      payerAta,
      merchantAta,
      config.payer,
      merchantAmountRaw,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Instruction B: Transfer to Platform (0.5%)
  transaction.add(
    createTransferInstruction(
      payerAta,
      platformAta,
      config.payer,
      platformAmountRaw,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Optional: Add memo for invoice reconciliation
  if (config.memo) {
    transaction.add(createMemoInstruction(config.memo));
  }

  // Set transaction metadata
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = config.payer;

  return transaction;
}

// ============================================
// MAIN TRANSACTION BUILDER
// ============================================

/**
 * Create a split payment transaction for invoice payment
 * 
 * This is the main entry point for building payment transactions.
 * The transaction includes:
 * - 99.5% transfer to merchant wallet
 * - 0.5% transfer to BlinkPay platform wallet
 * - Optional memo for invoice reconciliation
 * 
 * @param connection - Solana connection instance
 * @param config - Payment configuration
 * @returns Unsigned transaction ready for signing
 * 
 * @example
 * ```typescript
 * const tx = await createSplitPaymentTransaction(connection, {
 *   payer: payerPubkey,
 *   merchant: merchantPubkey,
 *   platform: BLINKPAY_PLATFORM_WALLET,
 *   amount: 100, // 100 USDC
 *   token: 'USDC',
 *   memo: 'INV-2024-00001',
 * });
 * ```
 */
export async function createSplitPaymentTransaction(
  connection: Connection,
  config: SplitPaymentConfig
): Promise<Transaction> {
  // Validate inputs
  if (config.amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  // Route to appropriate transaction builder
  if (config.token === 'SOL') {
    return createSplitSolTransaction(connection, config);
  }

  return createSplitSplTransaction(connection, config);
}

/**
 * Legacy function for single recipient payments
 * @deprecated Use createSplitPaymentTransaction for production
 */
export async function createPaymentTransaction(
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number,
  token: SupportedToken,
  memo?: string
): Promise<Transaction> {
  // Use split payment with platform fee
  return createSplitPaymentTransaction(connection, {
    payer: fromPubkey,
    merchant: toPubkey,
    platform: BLINKPAY_PLATFORM_WALLET,
    amount,
    token,
    memo,
  });
}

// ============================================
// TRANSACTION HELPERS
// ============================================

/**
 * Serialize transaction to base64 for API response
 */
export function serializeTransaction(transaction: Transaction): string {
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  return Buffer.from(serialized).toString('base64');
}

/**
 * Deserialize transaction from base64
 */
export function deserializeTransaction(base64: string): Transaction {
  const buffer = Buffer.from(base64, 'base64');
  return Transaction.from(buffer);
}

/**
 * Estimate transaction fee in lamports
 */
export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  const fee = await connection.getFeeForMessage(
    transaction.compileMessage(),
    'confirmed'
  );
  return fee.value || 5000; // Default to 5000 lamports if estimation fails
}
