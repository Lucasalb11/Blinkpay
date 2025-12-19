---
sidebar_position: 1
---

# Developer Guide

This guide provides technical details for developers building with or integrating Blinkpay.

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contract │    │   Solana        │
│   (Next.js)     │◄──►│   (Anchor)      │◄──►│   Network       │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Payment Logic │    │ • Program ID    │
│ • Wallet Conn.  │    │ • PDA Mgmt      │    │ • Accounts      │
│ • API Client    │    │ • Token Trans.  │    │ • Transactions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Smart Contract** | Rust + Anchor | Core business logic |
| **Frontend** | Next.js + TypeScript | User interface |
| **Wallet Integration** | @solana/wallet-adapter | Wallet connections |
| **RPC** | @solana/web3.js | Blockchain interaction |
| **Styling** | Tailwind CSS | UI components |
| **State Management** | React Context | Application state |

## 📋 Prerequisites

### Development Environment

```bash
# Required versions
Node.js >= 18.0.0
Rust >= 1.70.0
Anchor >= 0.32.0
Solana CLI >= 1.18.0

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Project Structure

```
blinkpay/
├── system/                 # Smart Contract (Anchor)
│   ├── programs/
│   │   └── blinkpay/
│   │       └── src/
│   │           └── lib.rs
│   ├── tests/
│   └── migrations/
├── frontend/               # Web Application
│   ├── src/
│   │   ├── lib/
│   │   ├── components/
│   │   └── app/
│   └── public/
└── docs/                   # Documentation
```

## 🔧 Smart Contract Development

### Program ID and Configuration

```rust
// Program ID (system/programs/blinkpay/src/lib.rs)
declare_id!("GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV");

// Network configuration (system/Anchor.toml)
[programs.devnet]
blinkpay = "GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV"
```

### Core Data Structures

#### Payment Request Account

```rust
#[account]
pub struct PaymentRequest {
    pub authority: Pubkey,           // Request creator
    pub recipient: Pubkey,           // Payment recipient
    pub amount: u64,                 // Requested amount
    pub token_mint: Pubkey,          // Token mint address
    pub memo: String,                // Optional description
    pub status: PaymentStatus,       // Pending/Paid/Cancelled
    pub created_at: i64,             // Creation timestamp
    pub paid_at: Option<i64>,        // Payment timestamp
}
```

#### Scheduled Charge Account

```rust
#[account]
pub struct ScheduledCharge {
    pub authority: Pubkey,           // Charge creator
    pub recipient: Pubkey,           // Payment recipient
    pub amount: u64,                 // Charge amount
    pub token_mint: Pubkey,          // Token mint address
    pub charge_type: ChargeType,     // OneTime/Recurring
    pub execute_at: i64,             // Execution timestamp
    pub interval: Option<u64>,       // Recurring interval
    pub max_executions: Option<u32>, // Max executions
    pub executions: u32,             // Current executions
    pub status: ChargeStatus,        // Active/Completed/Cancelled
}
```

### PDA Derivation

#### Payment Request PDA

```rust
// Frontend (TypeScript)
export function getPaymentRequestPda(
  authority: PublicKey,
  recipient: PublicKey,
  amount: number,
  createdAt: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([
    Buffer.from('payment_request'),
    authority.toBuffer(),
    recipient.toBuffer(),
    new anchor.BN(amount).toArrayLike(Buffer, 'le', 8),
    new anchor.BN(createdAt).toArrayLike(Buffer, 'le', 8),
  ], PROGRAM_ID)
}

// Backend (Rust)
#[derive(Accounts)]
pub struct CreatePaymentRequest<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PaymentRequest::LEN,
        seeds = [
            b"payment_request",
            authority.key().as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &current_time.to_le_bytes()
        ],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
}
```

## 🔌 Frontend Integration

### Program Connection

```typescript
// src/lib/program.ts
import { Program, AnchorProvider, web3 } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import idl from './blinkpay.json'

export const PROGRAM_ID = new PublicKey('GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV')

export function getProgram(wallet: any): Program {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    'confirmed'
  )

  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  )

  return new Program(idl, PROGRAM_ID, provider)
}
```

### Wallet Integration

```typescript
// src/components/WalletProvider.tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

## 🔄 Transaction Flow

### Creating a Payment Request

```typescript
const createPaymentRequest = async (
  amount: number,
  tokenMint: PublicKey,
  recipient: PublicKey,
  memo: string
) => {
  const program = getProgram(wallet)
  const currentTime = Date.now()

  const [paymentRequestPda] = getPaymentRequestPda(
    wallet.publicKey,
    recipient,
    amount,
    currentTime
  )

  const tx = await program.methods
    .createPaymentRequest(
      new BN(amount),
      tokenMint,
      recipient,
      memo,
      new BN(currentTime)
    )
    .accounts({
      authority: wallet.publicKey,
      paymentRequest: paymentRequestPda,
      systemProgram: SystemProgram.programId,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .rpc()

  return tx
}
```

### Fulfilling a Payment Request

```typescript
const payRequest = async (requestPda: PublicKey) => {
  const program = getProgram(wallet)
  const request = await program.account.paymentRequest.fetch(requestPda)

  const tx = await program.methods
    .payRequest()
    .accounts({
      payer: wallet.publicKey,
      paymentRequest: requestPda,
      recipient: request.recipient,
      // Token accounts for SPL tokens...
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}
```

## 🧪 Testing

### Smart Contract Tests

```typescript
// system/tests/blinkpay.ts
import * as anchor from '@project-serum/anchor'
import { Program } from '@project-serum/anchor'
import { Blinkpay } from '../target/types/blinkpay'

describe('blinkpay', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Blinkpay as Program<Blinkpay>

  it('Creates a payment request', async () => {
    const authority = provider.wallet.publicKey
    const recipient = anchor.web3.Keypair.generate().publicKey
    const amount = new anchor.BN(1000000) // 1 SOL in lamports

    const [paymentRequestPda] = getPaymentRequestPda(
      authority,
      recipient,
      amount.toNumber(),
      Date.now()
    )

    await program.methods
      .createPaymentRequest(amount, NATIVE_MINT, recipient, 'Test payment', new anchor.BN(Date.now()))
      .accounts({
        authority,
        paymentRequest: paymentRequestPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc()

    const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda)
    expect(paymentRequest.amount.toNumber()).toEqual(amount.toNumber())
  })
})
```

### Frontend Testing

```typescript
// src/__tests__/PaymentModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentModal } from '../components/PaymentModal'

describe('PaymentModal', () => {
  it('renders payment form', () => {
    render(<PaymentModal open={true} onClose={() => {}} />)

    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipient')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Payment' })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<PaymentModal open={true} onClose={() => {}} />)

    const submitButton = screen.getByRole('button', { name: 'Send Payment' })
    fireEvent.click(submitButton)

    expect(await screen.findByText('Amount is required')).toBeInTheDocument()
  })
})
```

## 🚀 Deployment

### Smart Contract Deployment

```bash
# Build and deploy to devnet
cd system
anchor build
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta
```

### Frontend Deployment

```bash
# Build for production
cd frontend
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=out
```

## 🔐 Security Considerations

### Smart Contract Security
- **Input Validation**: All inputs validated on-chain
- **Authority Checks**: Only authorized users can execute actions
- **Safe Math**: Using checked arithmetic operations
- **Time Validation**: Prevent backdated transactions

### Frontend Security
- **No Private Keys**: Never store private keys in frontend
- **Transaction Signing**: All transactions require user approval
- **Input Sanitization**: Client and server-side validation
- **HTTPS Only**: All communications over secure channels

### Best Practices
- **Code Audits**: Regular security audits of smart contracts
- **Testing**: Comprehensive test coverage
- **Monitoring**: Transaction monitoring and alerting
- **Updates**: Secure upgrade mechanisms

## 📚 Additional Resources

- **[API Reference](../api-reference/overview.md)**: Complete function reference
- **[Contributing Guide](../contributing/overview.md)**: How to contribute
- **[Security Guide](../security/overview.md)**: Security best practices
- **[GitHub Repository](https://github.com/blinkpay/blinkpay)**: Source code and issues