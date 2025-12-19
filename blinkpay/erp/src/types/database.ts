/**
 * Database Types for Supabase
 * Auto-generated from schema, with manual refinements
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type TokenType = 'SOL' | 'USDC' | 'PYUSD' | 'USDT';
export type TransactionType = 'payment' | 'refund' | 'fee';
export type PaymentLinkType = 'instant' | 'recurring' | 'donation';
export type PaymentRequestStatus = 'pending' | 'viewed' | 'paid' | 'expired' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
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
        };
        Insert: {
          id?: string;
          wallet_address: string;
          business_name: string;
          business_email?: string | null;
          business_phone?: string | null;
          business_logo_url?: string | null;
          default_token?: TokenType;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          business_name?: string;
          business_email?: string | null;
          business_phone?: string | null;
          business_logo_url?: string | null;
          default_token?: TokenType;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
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
        };
        Insert: {
          id?: string;
          merchant_id: string;
          wallet_address?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          total_paid?: number;
          total_invoices?: number;
          last_payment_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          wallet_address?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          total_paid?: number;
          total_invoices?: number;
          last_payment_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
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
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id?: string | null;
          invoice_number?: string | null;
          amount: number;
          token?: TokenType;
          description?: string | null;
          due_date?: string | null;
          status?: InvoiceStatus;
          paid_at?: string | null;
          paid_amount?: number | null;
          paid_token?: TokenType | null;
          payer_wallet?: string | null;
          transaction_signature?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string | null;
          invoice_number?: string | null;
          amount?: number;
          token?: TokenType;
          description?: string | null;
          due_date?: string | null;
          status?: InvoiceStatus;
          paid_at?: string | null;
          paid_amount?: number | null;
          paid_token?: TokenType | null;
          payer_wallet?: string | null;
          transaction_signature?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
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
          raw_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id?: string | null;
          merchant_id: string;
          type: TransactionType;
          amount: number;
          token: TokenType;
          signature: string;
          slot?: number | null;
          block_time?: string | null;
          fee_lamports?: number | null;
          from_wallet: string;
          to_wallet: string;
          raw_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string | null;
          merchant_id?: string;
          type?: TransactionType;
          amount?: number;
          token?: TokenType;
          signature?: string;
          slot?: number | null;
          block_time?: string | null;
          fee_lamports?: number | null;
          from_wallet?: string;
          to_wallet?: string;
          raw_data?: Json | null;
          created_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          merchant_id: string | null;
          event_type: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id?: string | null;
          event_type: string;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string | null;
          event_type?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      payment_links: {
        Row: {
          id: string;
          merchant_id: string;
          slug: string | null;
          name: string;
          link_type: PaymentLinkType;
          fixed_amount: number | null;
          min_amount: number | null;
          max_amount: number | null;
          suggested_amounts: number[] | null;
          token: TokenType;
          title: string | null;
          description: string | null;
          image_url: string | null;
          success_message: string | null;
          redirect_url: string | null;
          max_payments: number | null;
          payment_count: number;
          expires_at: string | null;
          is_active: boolean;
          view_count: number;
          total_received: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          slug?: string | null;
          name: string;
          link_type?: PaymentLinkType;
          fixed_amount?: number | null;
          min_amount?: number | null;
          max_amount?: number | null;
          suggested_amounts?: number[] | null;
          token?: TokenType;
          title?: string | null;
          description?: string | null;
          image_url?: string | null;
          success_message?: string | null;
          redirect_url?: string | null;
          max_payments?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          slug?: string | null;
          name?: string;
          link_type?: PaymentLinkType;
          fixed_amount?: number | null;
          min_amount?: number | null;
          max_amount?: number | null;
          suggested_amounts?: number[] | null;
          token?: TokenType;
          title?: string | null;
          description?: string | null;
          image_url?: string | null;
          success_message?: string | null;
          redirect_url?: string | null;
          max_payments?: number | null;
          expires_at?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_requests: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string | null;
          request_number: string | null;
          amount: number;
          token: TokenType;
          description: string | null;
          recipient_wallet: string | null;
          recipient_email: string | null;
          recipient_name: string | null;
          status: PaymentRequestStatus;
          expires_at: string | null;
          first_viewed_at: string | null;
          view_count: number;
          paid_at: string | null;
          paid_amount: number | null;
          payer_wallet: string | null;
          transaction_signature: string | null;
          memo: string;
          reminder_sent_at: string | null;
          reminder_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id?: string | null;
          request_number?: string | null;
          amount: number;
          token?: TokenType;
          description?: string | null;
          recipient_wallet?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          status?: PaymentRequestStatus;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string | null;
          request_number?: string | null;
          amount?: number;
          token?: TokenType;
          description?: string | null;
          recipient_wallet?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          status?: PaymentRequestStatus;
          expires_at?: string | null;
          first_viewed_at?: string | null;
          view_count?: number;
          paid_at?: string | null;
          paid_amount?: number | null;
          payer_wallet?: string | null;
          transaction_signature?: string | null;
          reminder_sent_at?: string | null;
          reminder_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      link_payments: {
        Row: {
          id: string;
          link_id: string;
          merchant_id: string;
          amount: number;
          token: TokenType;
          payer_wallet: string;
          payer_name: string | null;
          payer_email: string | null;
          payer_message: string | null;
          transaction_signature: string;
          block_time: string | null;
          merchant_amount: number;
          platform_fee: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          merchant_id: string;
          amount: number;
          token: TokenType;
          payer_wallet: string;
          payer_name?: string | null;
          payer_email?: string | null;
          payer_message?: string | null;
          transaction_signature: string;
          block_time?: string | null;
          merchant_amount: number;
          platform_fee: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          merchant_id?: string;
          amount?: number;
          token?: TokenType;
          payer_wallet?: string;
          payer_name?: string | null;
          payer_email?: string | null;
          payer_message?: string | null;
          transaction_signature?: string;
          block_time?: string | null;
          merchant_amount?: number;
          platform_fee?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      merchant_dashboard_summary: {
        Row: {
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
        };
      };
      daily_transaction_volume: {
        Row: {
          merchant_id: string;
          date: string;
          token: TokenType;
          transaction_count: number;
          total_amount: number;
        };
      };
    };
    Functions: {
      mark_overdue_invoices: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      invoice_status: InvoiceStatus;
      token_type: TokenType;
      transaction_type: TransactionType;
    };
  };
}

// Convenient type aliases
export type Merchant = Database['public']['Tables']['merchants']['Row'];
export type MerchantInsert = Database['public']['Tables']['merchants']['Insert'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type PaymentLink = Database['public']['Tables']['payment_links']['Row'];
export type PaymentLinkInsert = Database['public']['Tables']['payment_links']['Insert'];
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row'];
export type PaymentRequestInsert = Database['public']['Tables']['payment_requests']['Insert'];
export type LinkPayment = Database['public']['Tables']['link_payments']['Row'];
export type LinkPaymentInsert = Database['public']['Tables']['link_payments']['Insert'];
export type DashboardSummary = Database['public']['Views']['merchant_dashboard_summary']['Row'];
export type DailyVolume = Database['public']['Views']['daily_transaction_volume']['Row'];
