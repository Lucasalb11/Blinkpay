# BlikPay Frontend

The frontend application for BlikPay, built with Next.js and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connection to Smart Contract

The frontend connects to the BlikPay smart contract through the following mechanisms:

### Program ID
- **Program ID**: `GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV`
- **IDL**: Generated from the Anchor program in `../system/target/idl/blinkpay.json`

### Wallet Integration
- Uses `@solana/wallet-adapter-react` for wallet connections
- Supports Phantom, Solflare, and Backpack wallets
- Connected to Solana Devnet by default

### Smart Contract Interactions

#### Payment Requests
```typescript
// Create payment request
const createRequest = async (amount: number, tokenMint: PublicKey, recipient: PublicKey, memo: string) => {
  const program = getProgram();
  const [requestPda] = PublicKey.findProgramAddressSync([
    Buffer.from("payment_request"),
    wallet.publicKey.toBuffer(),
    recipient.toBuffer(),
    new BN(amount).toArrayLike(Buffer, "le", 8),
    new BN(Date.now()).toArrayLike(Buffer, "le", 8),
  ], program.programId);

  await program.methods
    .createPaymentRequest(new BN(amount), tokenMint, recipient, memo, new BN(Date.now()))
    .accounts({ ... })
    .rpc();
};

// Pay payment request
const payRequest = async (requestPda: PublicKey) => {
  await program.methods
    .payRequest()
    .accounts({
      payer: wallet.publicKey,
      paymentRequest: requestPda,
      // ... other accounts
    })
    .rpc();
};
```

#### Scheduled Charges
```typescript
// Create scheduled charge
const createCharge = async (params) => {
  const [chargePda] = PublicKey.findProgramAddressSync([...], program.programId);

  await program.methods
    .createScheduledCharge(...)
    .accounts({ ... })
    .rpc();
};

// Execute scheduled charge
const executeCharge = async (chargePda: PublicKey) => {
  await program.methods
    .executeScheduledCharge()
    .accounts({ ... })
    .rpc();
};
```

### Environment Configuration

Create a `.env.local` file for environment-specific settings:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable components
│   │   ├── ui/             # UI components (Button, etc.)
│   │   ├── WalletProvider.tsx
│   │   └── WalletButton.tsx
│   └── lib/
│       └── utils.ts         # Utility functions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Security Notes

- Never commit private keys or wallet files
- Use environment variables for sensitive configuration
- Always verify transaction details before signing
- Implement proper error handling for failed transactions
