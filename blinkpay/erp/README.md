# BlinkPay ERP

A **Solana-native Payment ERP** inspired by Asaas. Generate payment links via Blinks, manage invoices, track customer relationships, and reconcile payments automatically.

## 🚀 Features

### Merchant Dashboard
- **Summary Cards**: Total Balance, Pending Revenue, Overdue Payments
- **Revenue Charts**: Daily transaction volume visualization
- **Quick Actions**: One-click invoice creation and management

### Blink Generator (Billing Engine)
- Create professional invoices with customer details
- Generate Solana Action URLs (Blinks) automatically
- Share payment links on Twitter/X for interactive payment cards
- Support for USDC, SOL, PYUSD, and USDT

### Payment Reconciliation
- Helius webhook integration for real-time payment tracking
- Automatic invoice status updates (pending → paid)
- Transaction memo matching for accurate reconciliation
- Unmatched payment logging for manual review

### Customer CRM
- Link wallet addresses to customer profiles
- Track payment history and lifetime value
- Customer tagging and notes
- Quick customer creation during invoice generation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI, Radix UI, Lucide React
- **Blockchain**: @solana/web3.js, @solana/actions, @solana/wallet-adapter
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)

## 📦 Installation

```bash
# Navigate to ERP directory
cd blinkpay/erp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🗃️ Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the schema SQL in your Supabase SQL Editor:

```bash
# The schema is located at:
cat supabase/schema.sql
```

3. Update your `.env.local` with Supabase credentials

## 🔗 Solana Actions (Blinks)

The ERP implements the [Solana Actions](https://solana.com/docs/advanced/actions) specification:

### Endpoints

- `GET /api/actions/pay/[id]` - Returns action metadata for Blink unfurling
- `POST /api/actions/pay/[id]` - Creates payment transaction for signing
- `OPTIONS /api/actions/pay/[id]` - CORS preflight

### Blink URL Format

```
solana-action:https://your-domain.com/api/actions/pay/{invoice_id}
```

When shared on Twitter/X or Dialect, this URL renders an interactive payment card.

## 🔔 Helius Webhook Setup

1. Create a webhook at [dev.helius.xyz/webhooks](https://dev.helius.xyz/webhooks)

2. Configure the webhook:
   - **URL**: `https://your-domain.com/api/webhooks/helius`
   - **Type**: Enhanced Transaction
   - **Addresses**: Add your merchant wallet address(es)

3. Copy the webhook secret to `HELIUS_WEBHOOK_SECRET`

### Payment Matching Logic

1. **Memo Match**: If transaction includes a memo, match by invoice memo (most accurate)
2. **Amount Match**: Fallback to matching by exact amount and token type
3. **Unmatched**: Log transaction for manual reconciliation

## 📁 Project Structure

```
erp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── actions/pay/[id]/    # Solana Actions endpoint
│   │   │   └── webhooks/helius/      # Payment reconciliation
│   │   ├── dashboard/
│   │   │   ├── invoices/             # Invoice management
│   │   │   ├── customers/            # CRM
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── pay/[id]/                 # Public payment page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── dashboard/                # Dashboard components
│   │   ├── layout/                   # Sidebar, header
│   │   └── ui/                       # Shadcn/UI components
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── env.ts                    # Environment config
│   │   ├── solana/actions.ts         # Solana utilities
│   │   ├── supabase/client.ts        # Database client
│   │   └── utils.ts                  # Helper functions
│   └── types/
│       └── database.ts               # TypeScript types
├── supabase/
│   └── schema.sql                    # Database schema
└── package.json
```

## 🎨 Design Philosophy

- **Fintech Enterprise**: Clean, professional B2B interface
- **Light Theme**: White/gray backgrounds, high contrast text
- **One-Click UX**: Generate → Share → Receive payments
- **Mobile Responsive**: Full functionality on all devices

## 🔒 Security Features

- **Wallet-Based Auth**: No passwords, connect with Solana wallet
- **Row Level Security**: Supabase RLS for data isolation
- **Webhook Verification**: HMAC signature validation
- **Non-Custodial**: Users control their own funds

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | ✅ |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Network (mainnet-beta/devnet) | ✅ |
| `HELIUS_API_KEY` | Helius API key | Optional |
| `HELIUS_WEBHOOK_SECRET` | Webhook HMAC secret | Optional |

## 🚧 Roadmap

- [ ] Multi-wallet support
- [ ] Recurring invoices / subscriptions
- [ ] Email notifications
- [ ] Invoice PDF export
- [ ] Batch payments
- [ ] API keys for external integrations
- [ ] Mobile app (React Native)

## 📄 License

ISC License

---

Built with ❤️ for the Solana ecosystem
