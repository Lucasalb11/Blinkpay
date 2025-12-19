# BlikPay: Frontend ↔ Smart Contract Connections

This document outlines how the frontend application connects to and interacts with the BlikPay smart contract.

## 🔗 Connection Overview

```
Frontend (Next.js + React) ↔ Solana Network ↔ BlikPay Program
```

## 📋 Configuration

### Frontend Configuration (`frontend/src/lib/config.ts`)
```typescript
export const PROGRAM_ID = new PublicKey('GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV')
export const NETWORK = 'devnet'
export const RPC_ENDPOINT = `https://api.${NETWORK}.solana.com`
```

### Smart Contract Configuration (`system/Anchor.toml`)
```toml
[programs.localnet]
blinkpay = "GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV"
```

## 🔧 Program Interface (IDL)

### IDL Generation
- **Source**: `system/programs/blinkpay/src/lib.rs`
- **Output**: `system/target/idl/blinkpay.json`
- **Usage**: Frontend imports IDL for type-safe interactions

### IDL Import (Frontend)
```typescript
import idl from '../../../system/target/idl/blinkpay.json'
const program = new Program(idl, PROGRAM_ID, provider)
```

## 🏦 Program Initialization

### Provider Setup (`frontend/src/lib/program.ts`)
```typescript
export function getProvider(wallet?: any): AnchorProvider {
  const connection = new Connection(RPC_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  })
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
}

export function getProgram(wallet?: any): BlikPayProgram {
  const provider = getProvider(wallet)
  return new Program(idl as Idl, PROGRAM_ID, provider)
}
```

## 📊 Account Management

### PDA Derivation (Consistent Across Frontend/Backend)

#### Payment Request PDA
```typescript
// Frontend (frontend/src/lib/program.ts)
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

// Backend (system/programs/blinkpay/src/instructions/payment_request.rs)
seeds = [
  b"payment_request",
  authority.key().as_ref(),
  recipient.as_ref(),
  &amount.to_le_bytes(),
  &current_time.to_le_bytes()
]
```

#### Scheduled Charge PDA
```typescript
// Frontend
export function getScheduledChargePda(
  authority: PublicKey,
  recipient: PublicKey,
  amount: number,
  executeAt: number,
  chargeType: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([
    Buffer.from('scheduled_charge'),
    authority.toBuffer(),
    recipient.toBuffer(),
    new anchor.BN(amount).toArrayLike(Buffer, 'le', 8),
    new anchor.BN(executeAt).toArrayLike(Buffer, 'le', 8),
    new Uint8Array([chargeType]),
  ], PROGRAM_ID)
}

// Backend (system/programs/blinkpay/src/instructions/scheduled_charge.rs)
seeds = [
  b"scheduled_charge",
  authority.key().as_ref(),
  recipient.as_ref(),
  &amount.to_le_bytes(),
  &execute_at.to_le_bytes(),
  &[charge_type as u8],
]
```

## 🔄 Transaction Flow

### 1. Payment Request Creation

**Frontend → Smart Contract:**
```typescript
// User clicks "Request Payment" → Form submission
const program = useProgram()
const currentTime = Date.now()

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
    paymentRequest: paymentRequestPda, // Derived PDA
    systemProgram: SystemProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .rpc()
```

**Smart Contract Processing:**
- Validates inputs (amount > 0, valid token, etc.)
- Creates PaymentRequest account at PDA
- Sets status to Pending
- Records timestamp and metadata

### 2. Payment Request Fulfillment

**Frontend → Smart Contract:**
```typescript
// User clicks "Pay Now" on request
await program.methods
  .payRequest()
  .accounts({
    payer: wallet.publicKey,
    paymentRequest: requestPda,
    recipient: recipientPubkey,
    // Token accounts if SPL token
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

**Smart Contract Processing:**
- Validates request status (must be Pending)
- Transfers tokens from payer to recipient
- Updates request status to Paid
- Prevents double payment

### 3. Scheduled Charge Creation

**Frontend → Smart Contract:**
```typescript
const executeAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now

await program.methods
  .createScheduledCharge(
    new BN(amount),
    tokenMint,
    recipient,
    new BN(executeAt),
    0, // OneTime
    null, // no interval
    null, // no max executions
    memo,
    new BN(Date.now())
  )
  .accounts({
    authority: wallet.publicKey,
    scheduledCharge: chargePda,
    systemProgram: SystemProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .rpc()
```

### 4. Scheduled Charge Execution

**Permissionless Execution (Anyone can trigger):**
```typescript
await program.methods
  .executeScheduledCharge()
  .accounts({
    executor: wallet.publicKey, // Can be anyone
    scheduledCharge: chargePda,
    authority: chargeAuthority, // Who created the charge
    recipient: recipientPubkey,
    // Token accounts
    systemProgram: SystemProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .rpc()
```

## 🔐 Security Connections

### Wallet Integration
- **Frontend**: `@solana/wallet-adapter-react` for connection
- **Security**: All transactions require user signature
- **No Custody**: Frontend never holds private keys

### Input Validation
- **Frontend**: Client-side validation (UX)
- **Smart Contract**: Server-side validation (Security)
- **Consistency**: Same validation rules in both places

### Error Handling
```typescript
try {
  await program.methods.someInstruction(params).rpc()
} catch (error) {
  // Handle AnchorError, network errors, etc.
  console.error('Transaction failed:', error)
}
```

## 🌐 Network Configuration

### Development
- **Network**: Localnet (`anchor localnet`)
- **RPC**: `http://localhost:8899`
- **Program ID**: Deployed locally

### Staging/Testing
- **Network**: Devnet
- **RPC**: `https://api.devnet.solana.com`
- **Program ID**: Fixed in configuration

### Production
- **Network**: Mainnet-beta
- **RPC**: `https://api.mainnet-beta.solana.com`
- **Program ID**: Same as devnet

## 🔄 State Synchronization

### Real-time Updates
- **Polling**: Frontend polls for account state changes
- **WebSocket**: Connection to Solana for instant updates
- **Optimistic UI**: Immediate UI feedback, confirmed by on-chain state

### Account Fetching
```typescript
// Fetch payment request data
const paymentRequest = await program.account.paymentRequest.fetch(pda)

// Fetch scheduled charge data
const scheduledCharge = await program.account.scheduledCharge.fetch(pda)
```

## 🧪 Testing Connections

### Unit Tests (`system/tests/blinkpay.ts`)
- Test smart contract logic in isolation
- Mock wallet and provider interactions
- Validate PDA derivation consistency

### Integration Tests
- Frontend connects to deployed program
- End-to-end transaction flows
- Wallet interaction testing

## 📊 Monitoring & Debugging

### Transaction Logs
```typescript
// Enable detailed logging
program.addEventListener('logs', (logs) => {
  console.log('Program logs:', logs)
})
```

### Account Inspection
```typescript
// Check account state
const accountInfo = await connection.getAccountInfo(pda)
console.log('Account data:', accountInfo)
```

## 🚀 Deployment Connections

### Program Deployment
```bash
cd system
anchor build
anchor deploy
```

### Frontend Deployment
```bash
cd frontend
npm run build
npm run start
```

### Environment Variables
```env
# frontend/.env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1u6UwbXnua8jU1EXazwyyPV
```

This ensures seamless connection between frontend and smart contract across all environments.
