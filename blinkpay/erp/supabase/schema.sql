-- ============================================
-- BLINKPAY ERP - SUPABASE SCHEMA
-- Solana-native Payment Management System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Invoice status tracking
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'pending',
  'paid',
  'overdue',
  'cancelled',
  'refunded'
);

-- Supported tokens
CREATE TYPE token_type AS ENUM (
  'SOL',
  'USDC',
  'PYUSD',
  'USDT'
);

-- Transaction type
CREATE TYPE transaction_type AS ENUM (
  'payment',
  'refund',
  'fee'
);

-- ============================================
-- MERCHANTS TABLE
-- Stores merchant/business information
-- ============================================

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Wallet & Authentication
  wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Solana wallet address
  
  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255),
  business_phone VARCHAR(20),
  business_logo_url TEXT,
  
  -- Settings
  default_token token_type DEFAULT 'USDC',
  webhook_url TEXT, -- Optional custom webhook for payment notifications
  webhook_secret VARCHAR(64), -- HMAC secret for webhook verification
  
  -- API Access
  api_key VARCHAR(64) UNIQUE, -- For programmatic access
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexing for performance
  CONSTRAINT wallet_address_format CHECK (LENGTH(wallet_address) BETWEEN 32 AND 44)
);

-- Index for wallet lookups
CREATE INDEX idx_merchants_wallet ON merchants(wallet_address);
CREATE INDEX idx_merchants_api_key ON merchants(api_key);

-- ============================================
-- CUSTOMERS TABLE
-- CRM: Links wallet addresses to customer info
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Customer Identification
  wallet_address VARCHAR(44), -- Can be null for email-only customers
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Customer Metadata
  tags TEXT[], -- For categorization (e.g., ['vip', 'enterprise'])
  notes TEXT,
  
  -- Statistics (denormalized for performance)
  total_paid DECIMAL(20, 6) DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  last_payment_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(merchant_id, wallet_address),
  UNIQUE(merchant_id, email)
);

-- Indexes
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_wallet ON customers(wallet_address);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- INVOICES TABLE
-- Core billing entity - generates Blinks
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Invoice Details
  invoice_number VARCHAR(50), -- Human-readable (e.g., INV-2024-001)
  amount DECIMAL(20, 6) NOT NULL CHECK (amount > 0),
  token token_type NOT NULL DEFAULT 'USDC',
  description TEXT,
  
  -- Due Date & Status
  due_date DATE,
  status invoice_status DEFAULT 'pending',
  
  -- Blink/Action URL Data
  action_url TEXT GENERATED ALWAYS AS (
    'solana-action:https://blinkpay.app/api/actions/pay/' || id::TEXT
  ) STORED,
  
  -- Payment Metadata (populated when paid)
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(20, 6),
  paid_token token_type,
  payer_wallet VARCHAR(44),
  transaction_signature VARCHAR(88), -- Solana tx signature
  
  -- Memo for on-chain matching
  memo VARCHAR(32) GENERATED ALWAYS AS (
    SUBSTRING(id::TEXT FROM 1 FOR 8)
  ) STORED,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_paid_status CHECK (
    (status = 'paid' AND paid_at IS NOT NULL AND transaction_signature IS NOT NULL)
    OR status != 'paid'
  )
);

-- Indexes for common queries
CREATE INDEX idx_invoices_merchant ON invoices(merchant_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX idx_invoices_memo ON invoices(memo);
CREATE INDEX idx_invoices_tx_sig ON invoices(transaction_signature);

-- ============================================
-- TRANSACTIONS TABLE
-- Audit log of all financial movements
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Transaction Details
  type transaction_type NOT NULL,
  amount DECIMAL(20, 6) NOT NULL,
  token token_type NOT NULL,
  
  -- Solana Data
  signature VARCHAR(88) UNIQUE NOT NULL, -- Transaction signature
  slot BIGINT,
  block_time TIMESTAMPTZ,
  fee_lamports BIGINT,
  
  -- Wallet Information
  from_wallet VARCHAR(44) NOT NULL,
  to_wallet VARCHAR(44) NOT NULL,
  
  -- Metadata
  raw_data JSONB, -- Full transaction data from RPC/Helius
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_signature ON transactions(signature);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- WEBHOOK_EVENTS TABLE
-- Logs all incoming webhook events for debugging
-- ============================================

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  -- Event Data
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for unprocessed events
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(processed) WHERE processed = FALSE;

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard summary view for merchants
CREATE VIEW merchant_dashboard_summary AS
SELECT 
  m.id AS merchant_id,
  m.wallet_address,
  m.business_name,
  
  -- Balance calculations
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.paid_amount ELSE 0 END), 0) AS total_received,
  COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END), 0) AS pending_amount,
  COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END), 0) AS overdue_amount,
  
  -- Invoice counts
  COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_count,
  COUNT(CASE WHEN i.status = 'pending' THEN 1 END) AS pending_count,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count,
  COUNT(*) AS total_invoices
  
FROM merchants m
LEFT JOIN invoices i ON i.merchant_id = m.id
GROUP BY m.id;

-- Daily transaction volume for charts
CREATE VIEW daily_transaction_volume AS
SELECT 
  merchant_id,
  DATE(paid_at) AS date,
  token,
  COUNT(*) AS transaction_count,
  SUM(paid_amount) AS total_amount
FROM invoices
WHERE status = 'paid' AND paid_at IS NOT NULL
GROUP BY merchant_id, DATE(paid_at), token
ORDER BY date DESC;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer statistics after payment
CREATE OR REPLACE FUNCTION update_customer_stats_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET 
      total_paid = total_paid + NEW.paid_amount,
      total_invoices = total_invoices + 1,
      last_payment_at = NEW.paid_at,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_payment();

-- Function to generate sequential invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE merchant_id = NEW.merchant_id
    AND invoice_number LIKE 'INV-' || year_str || '-%';
  
  NEW.invoice_number := 'INV-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Merchants can only access their own data
-- Note: In production, use Supabase Auth with JWT claims

-- Policy for merchants (self-access)
CREATE POLICY merchants_self_access ON merchants
  FOR ALL USING (TRUE); -- Adjust based on auth strategy

-- Policy for customers (merchant access)
CREATE POLICY customers_merchant_access ON customers
  FOR ALL USING (TRUE); -- Adjust based on auth strategy

-- Policy for invoices (merchant access)
CREATE POLICY invoices_merchant_access ON invoices
  FOR ALL USING (TRUE); -- Adjust based on auth strategy

-- Policy for transactions (merchant access)
CREATE POLICY transactions_merchant_access ON transactions
  FOR ALL USING (TRUE); -- Adjust based on auth strategy

-- Policy for webhook_events (merchant access)
CREATE POLICY webhook_events_merchant_access ON webhook_events
  FOR ALL USING (TRUE); -- Adjust based on auth strategy

-- ============================================
-- SAMPLE DATA (Development Only)
-- ============================================

-- Uncomment for development testing
/*
INSERT INTO merchants (wallet_address, business_name, business_email) VALUES
  ('EXAMPLExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Demo Coffee Shop', 'demo@blinkpay.app');
*/
