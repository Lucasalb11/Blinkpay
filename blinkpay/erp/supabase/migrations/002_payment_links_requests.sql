-- ============================================
-- BLINKPAY ERP - PAYMENT LINKS & REQUESTS
-- Migration: 002_payment_links_requests.sql
-- ============================================

-- ============================================
-- NEW ENUMS
-- ============================================

-- Payment link type
CREATE TYPE payment_link_type AS ENUM (
  'instant',    -- Quick pay link (fixed or variable amount)
  'recurring',  -- Subscription-style link
  'donation'    -- Variable amount (payer chooses)
);

-- Payment request status
CREATE TYPE payment_request_status AS ENUM (
  'pending',    -- Waiting for payment
  'viewed',     -- Payer has viewed the request
  'paid',       -- Payment completed
  'expired',    -- Request expired
  'cancelled'   -- Cancelled by merchant
);

-- ============================================
-- PAYMENT LINKS TABLE
-- Reusable payment links (no invoice needed)
-- ============================================

CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Link Configuration
  slug VARCHAR(50) UNIQUE, -- Short URL: /pay/link/{slug}
  name VARCHAR(255) NOT NULL, -- Internal name (e.g., "Coffee Tip Jar")
  
  -- Payment Settings
  link_type payment_link_type DEFAULT 'instant',
  fixed_amount DECIMAL(20, 6), -- NULL for variable/donation
  min_amount DECIMAL(20, 6), -- Minimum for variable amounts
  max_amount DECIMAL(20, 6), -- Maximum for variable amounts
  suggested_amounts DECIMAL(20, 6)[], -- Quick-select buttons (e.g., [5, 10, 25])
  token token_type NOT NULL DEFAULT 'USDC',
  
  -- Display Settings
  title VARCHAR(255), -- Public title shown to payers
  description TEXT, -- Public description
  image_url TEXT, -- Custom image for the Blink
  success_message TEXT, -- Message after payment
  redirect_url TEXT, -- Redirect after payment (optional)
  
  -- Limits & Expiry
  max_payments INTEGER, -- NULL = unlimited
  payment_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  total_received DECIMAL(20, 6) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_links_merchant ON payment_links(merchant_id);
CREATE INDEX idx_payment_links_slug ON payment_links(slug);
CREATE INDEX idx_payment_links_active ON payment_links(is_active) WHERE is_active = TRUE;

-- Generate random slug if not provided
CREATE OR REPLACE FUNCTION generate_payment_link_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_payment_link_slug
  BEFORE INSERT ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_link_slug();

-- ============================================
-- PAYMENT REQUESTS TABLE
-- Request payment from specific wallet/email
-- ============================================

CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Request Details
  request_number VARCHAR(50), -- Human-readable (e.g., REQ-2024-001)
  amount DECIMAL(20, 6) NOT NULL CHECK (amount > 0),
  token token_type NOT NULL DEFAULT 'USDC',
  description TEXT,
  
  -- Recipient Info (who should pay)
  recipient_wallet VARCHAR(44), -- Target wallet address
  recipient_email VARCHAR(255), -- For email notifications
  recipient_name VARCHAR(255),
  
  -- Status & Tracking
  status payment_request_status DEFAULT 'pending',
  
  -- Expiry
  expires_at TIMESTAMPTZ, -- NULL = 30 days default
  
  -- View Tracking
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  -- Payment Info (when paid)
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(20, 6),
  payer_wallet VARCHAR(44),
  transaction_signature VARCHAR(88),
  
  -- Memo for reconciliation
  memo VARCHAR(32) GENERATED ALWAYS AS (
    'REQ-' || SUBSTRING(id::TEXT FROM 1 FOR 8)
  ) STORED,
  
  -- Notification Settings
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_requests_merchant ON payment_requests(merchant_id);
CREATE INDEX idx_payment_requests_customer ON payment_requests(customer_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_recipient_wallet ON payment_requests(recipient_wallet);
CREATE INDEX idx_payment_requests_recipient_email ON payment_requests(recipient_email);
CREATE INDEX idx_payment_requests_memo ON payment_requests(memo);

-- Generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'REQ-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM payment_requests
  WHERE merchant_id = NEW.merchant_id
    AND request_number LIKE 'REQ-' || year_str || '-%';
  
  NEW.request_number := 'REQ-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_request_number
  BEFORE INSERT ON payment_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_request_number();

-- ============================================
-- LINK PAYMENTS TABLE
-- Track payments made via payment links
-- ============================================

CREATE TABLE link_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(20, 6) NOT NULL,
  token token_type NOT NULL,
  
  -- Payer Info
  payer_wallet VARCHAR(44) NOT NULL,
  payer_name VARCHAR(255), -- If provided via form
  payer_email VARCHAR(255),
  payer_message TEXT, -- Optional message from payer
  
  -- Transaction
  transaction_signature VARCHAR(88) UNIQUE NOT NULL,
  block_time TIMESTAMPTZ,
  
  -- Fees
  merchant_amount DECIMAL(20, 6) NOT NULL,
  platform_fee DECIMAL(20, 6) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_link_payments_link ON link_payments(link_id);
CREATE INDEX idx_link_payments_merchant ON link_payments(merchant_id);
CREATE INDEX idx_link_payments_payer ON link_payments(payer_wallet);
CREATE INDEX idx_link_payments_created ON link_payments(created_at DESC);

-- Update payment_links stats on new payment
CREATE OR REPLACE FUNCTION update_payment_link_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE payment_links
  SET 
    payment_count = payment_count + 1,
    total_received = total_received + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_link_stats
  AFTER INSERT ON link_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_link_stats();

-- ============================================
-- VIEWS
-- ============================================

-- Active payment links summary
CREATE VIEW active_payment_links AS
SELECT 
  pl.*,
  m.business_name,
  m.wallet_address AS merchant_wallet
FROM payment_links pl
JOIN merchants m ON m.id = pl.merchant_id
WHERE pl.is_active = TRUE
  AND (pl.expires_at IS NULL OR pl.expires_at > NOW())
  AND (pl.max_payments IS NULL OR pl.payment_count < pl.max_payments);

-- Pending payment requests
CREATE VIEW pending_payment_requests AS
SELECT 
  pr.*,
  m.business_name,
  m.wallet_address AS merchant_wallet,
  c.name AS customer_name
FROM payment_requests pr
JOIN merchants m ON m.id = pr.merchant_id
LEFT JOIN customers c ON c.id = pr.customer_id
WHERE pr.status IN ('pending', 'viewed')
  AND (pr.expires_at IS NULL OR pr.expires_at > NOW());

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_payments ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth strategy)
CREATE POLICY payment_links_merchant_access ON payment_links FOR ALL USING (TRUE);
CREATE POLICY payment_requests_merchant_access ON payment_requests FOR ALL USING (TRUE);
CREATE POLICY link_payments_merchant_access ON link_payments FOR ALL USING (TRUE);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
