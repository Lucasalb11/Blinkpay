/**
 * BLINKPAY ERP - Supabase Type Definitions
 * Auto-generated types for database schema
 */

export type InvoiceStatus = 
  | 'draft'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type TokenType = 'SOL' | 'USDC' | 'PYUSD' | 'USDT';

export type TransactionType = 'payment' | 'refund' | 'fee';

// ============================================
// Database Tables
// ============================================

export interface Merchant {
  id: string;
  wallet_address: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  business_logo_url: string | null;
  default_token: TokenType;
  webhook_url: string | null;
  webhook_secret: string | null;
  api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  wallet_address: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  notes: string | null;
  total_paid: number;
  total_invoices: number;
  last_payment_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  invoice_number: string | null;
  amount: number;
  token: TokenType;
  description: string | null;
  due_date: string | null;
  status: InvoiceStatus;
  action_url: string;
  paid_at: string | null;
  paid_amount: number | null;
  paid_token: TokenType | null;
  payer_wallet: string | null;
  transaction_signature: string | null;
  memo: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  invoice_id: string | null;
  merchant_id: string;
  type: TransactionType;
  amount: number;
  token: TokenType;
  signature: string;
  slot: number | null;
  block_time: string | null;
  fee_lamports: number | null;
  from_wallet: string;
  to_wallet: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  merchant_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ============================================
// Views
// ============================================

export interface MerchantDashboardSummary {
  merchant_id: string;
  wallet_address: string;
  business_name: string;
  total_received: number;
  pending_amount: number;
  overdue_amount: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  total_invoices: number;
}

export interface DailyTransactionVolume {
  merchant_id: string;
  date: string;
  token: TokenType;
  transaction_count: number;
  total_amount: number;
}

// ============================================
// Insert/Update Types
// ============================================

export interface MerchantInsert {
  wallet_address: string;
  business_name: string;
  business_email?: string | null;
  business_phone?: string | null;
  business_logo_url?: string | null;
  default_token?: TokenType;
  webhook_url?: string | null;
}

export interface CustomerInsert {
  merchant_id: string;
  wallet_address?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[] | null;
  notes?: string | null;
}

export interface InvoiceInsert {
  merchant_id: string;
  customer_id?: string | null;
  amount: number;
  token?: TokenType;
  description?: string | null;
  due_date?: string | null;
  status?: InvoiceStatus;
  metadata?: Record<string, unknown>;
}

export interface InvoiceUpdate {
  status?: InvoiceStatus;
  paid_at?: string;
  paid_amount?: number;
  paid_token?: TokenType;
  payer_wallet?: string;
  transaction_signature?: string;
}

// ============================================
// Supabase Database Type
// ============================================

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: Merchant;
        Insert: MerchantInsert;
        Update: Partial<MerchantInsert>;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: Partial<CustomerInsert>;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: never;
      };
      webhook_events: {
        Row: WebhookEvent;
        Insert: Omit<WebhookEvent, 'id' | 'created_at'>;
        Update: { processed?: boolean; processed_at?: string; error_message?: string };
      };
    };
    Views: {
      merchant_dashboard_summary: {
        Row: MerchantDashboardSummary;
      };
      daily_transaction_volume: {
        Row: DailyTransactionVolume;
      };
    };
  };
}
