---
sidebar_position: 1
---

# API Reference

Complete reference for Blinkpay smart contract functions and data structures.

## 📋 Program Information

- **Program ID**: `GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV`
- **Network**: Solana Devnet/Mainnet-Beta
- **Framework**: Anchor v0.32.0
- **Language**: Rust

## 🏗️ Data Structures

### PaymentRequest

```rust
#[account]
pub struct PaymentRequest {
    pub authority: Pubkey,           // Request creator
    pub recipient: Pubkey,           // Payment recipient
    pub amount: u64,                 // Requested amount (lamports)
    pub token_mint: Pubkey,          // Token mint address
    pub memo: String,                // Optional description (max 200 chars)
    pub status: PaymentStatus,       // Request status
    pub created_at: i64,             // Creation timestamp
    pub paid_at: Option<i64>,        // Payment timestamp
}
```

**PaymentStatus Enum:**
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,    // Waiting for payment
    Paid,       // Successfully paid
    Cancelled,  // Cancelled by authority
}
```

### ScheduledCharge

```rust
#[account]
pub struct ScheduledCharge {
    pub authority: Pubkey,           // Charge creator
    pub recipient: Pubkey,           // Payment recipient
    pub amount: u64,                 // Charge amount (lamports)
    pub token_mint: Pubkey,          // Token mint address
    pub charge_type: ChargeType,     // Charge type
    pub execute_at: i64,             // Execution timestamp
    pub interval: Option<u64>,       // Recurring interval (seconds)
    pub max_executions: Option<u32>, // Maximum executions
    pub executions: u32,             // Current execution count
    pub status: ChargeStatus,        // Charge status
    pub memo: String,                // Optional description
    pub created_at: i64,             // Creation timestamp
}
```

**ChargeType Enum:**
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChargeType {
    OneTime,    // Single scheduled payment
    Recurring,  // Regular interval payments
}
```

**ChargeStatus Enum:**
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChargeStatus {
    Active,     // Charge is active
    Completed,  // Charge completed (one-time) or reached max executions
    Cancelled,  // Cancelled by authority
    Paused,     // Temporarily paused
}
```

## 🔧 Instruction Reference

### Payment Request Instructions

#### `create_payment_request`

Creates a new payment request.

**Parameters:**
- `amount: u64` - Requested amount in lamports
- `token_mint: Pubkey` - Token mint address (NATIVE_MINT for SOL)
- `recipient: Pubkey` - Recipient wallet address
- `memo: String` - Optional description
- `current_time: i64` - Current timestamp

**Accounts:**
- `authority` - Request creator (signer, writable)
- `payment_request` - Payment request PDA (init, writable)
- `system_program` - System program

**PDA Seeds:**
```
[
  "payment_request",
  authority,
  recipient,
  amount.to_le_bytes(),
  current_time.to_le_bytes()
]
```

**TypeScript Usage:**
```typescript
const tx = await program.methods
  .createPaymentRequest(
    new BN(amount),
    tokenMint,
    recipient,
    memo,
    new BN(Date.now())
  )
  .accounts({
    authority: wallet.publicKey,
    paymentRequest: paymentRequestPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

#### `pay_request`

Fulfills a payment request by transferring tokens.

**Accounts:**
- `payer` - Payment sender (signer, writable)
- `payment_request` - Payment request account (writable)
- `recipient` - Recipient wallet (writable)
- `payer_token_account` - Payer's token account (optional, for SPL tokens)
- `recipient_token_account` - Recipient's token account (optional, for SPL tokens)
- `token_mint` - Token mint (optional, for SPL tokens)
- `token_program` - Token program (optional, for SPL tokens)
- `system_program` - System program

**Validation:**
- Request status must be `Pending`
- Payer must have sufficient balance
- Request hasn't been paid before

**TypeScript Usage:**
```typescript
const tx = await program.methods
  .payRequest()
  .accounts({
    payer: wallet.publicKey,
    paymentRequest: requestPda,
    recipient: request.recipient,
    // ... token accounts for SPL transfers
  })
  .rpc()
```

#### `cancel_payment_request`

Cancels a pending payment request.

**Accounts:**
- `authority` - Request creator (signer)
- `payment_request` - Payment request account (writable)

**Validation:**
- Only authority can cancel
- Request must be in `Pending` status

### Scheduled Charge Instructions

#### `create_scheduled_charge`

Creates a new scheduled charge.

**Parameters:**
- `amount: u64` - Charge amount in lamports
- `token_mint: Pubkey` - Token mint address
- `recipient: Pubkey` - Recipient wallet address
- `execute_at: i64` - Execution timestamp
- `charge_type: ChargeType` - OneTime or Recurring
- `interval: Option<u64>` - Recurring interval in seconds
- `max_executions: Option<u32>` - Maximum executions for recurring
- `memo: String` - Optional description
- `current_time: i64` - Current timestamp

**Accounts:**
- `authority` - Charge creator (signer, writable)
- `scheduled_charge` - Scheduled charge PDA (init, writable)
- `system_program` - System program
- `clock` - Sysvar clock

**PDA Seeds:**
```
[
  "scheduled_charge",
  authority,
  recipient,
  amount.to_le_bytes(),
  execute_at.to_le_bytes(),
  &[charge_type as u8]
]
```

#### `execute_scheduled_charge`

Executes a scheduled charge (permissionless).

**Accounts:**
- `executor` - Transaction executor (signer, writable)
- `scheduled_charge` - Scheduled charge account (writable)
- `authority` - Charge creator (writable)
- `recipient` - Recipient wallet (writable)
- `authority_token_account` - Authority's token account
- `recipient_token_account` - Recipient's token account
- `token_mint` - Token mint
- `token_program` - Token program
- `clock` - Sysvar clock

**Validation:**
- Current time >= execute_at
- Charge status is `Active`
- Authority has sufficient balance
- For recurring: hasn't reached max_executions

#### `cancel_scheduled_charge`

Cancels an active scheduled charge.

**Accounts:**
- `authority` - Charge creator (signer)
- `scheduled_charge` - Scheduled charge account (writable)

**Validation:**
- Only authority can cancel
- Charge must be in `Active` status

## 🔑 PDA Derivation Functions

### Payment Request PDA

**Rust:**
```rust
pub fn get_payment_request_pda(
    authority: &Pubkey,
    recipient: &Pubkey,
    amount: u64,
    created_at: i64,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"payment_request",
            authority.as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &created_at.to_le_bytes(),
        ],
        &blinkpay::ID,
    )
}
```

**TypeScript:**
```typescript
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
```

### Scheduled Charge PDA

**Rust:**
```rust
pub fn get_scheduled_charge_pda(
    authority: &Pubkey,
    recipient: &Pubkey,
    amount: u64,
    execute_at: i64,
    charge_type: &ChargeType,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"scheduled_charge",
            authority.as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &execute_at.to_le_bytes(),
            &[charge_type.clone() as u8],
        ],
        &blinkpay::ID,
    )
}
```

**TypeScript:**
```typescript
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
```

## 📊 Account Sizes

| Account Type | Size (bytes) |
|--------------|--------------|
| PaymentRequest | 200 |
| ScheduledCharge | 280 |
| Minimum Account | 8 (discriminator) |

## ⏱️ Transaction Fees

### Estimated Costs (Devnet/Mainnet-Beta)

| Operation | SOL Fee | Notes |
|-----------|---------|-------|
| Create Payment Request | ~0.001 SOL | Base account creation |
| Pay Request (SOL) | ~0.001 SOL | Simple transfer |
| Pay Request (SPL) | ~0.002 SOL | Token transfer |
| Create Scheduled Charge | ~0.001 SOL | Base account creation |
| Execute Charge | ~0.002 SOL | Transfer + state update |
| Cancel Operations | ~0.0005 SOL | Simple state update |

## 🔐 Error Codes

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `0x1` | Invalid instruction data |
| `0x2` | Not authorized |
| `0x3` | Account not initialized |
| `0x4` | Invalid account data |
| `0x5` | Insufficient funds |
| `0x6` | Invalid token mint |
| `0x7` | Payment request already paid |
| `0x8` | Scheduled charge not active |
| `0x9` | Invalid timestamp |
| `0xA` | Maximum executions reached |

## 🌐 Network Endpoints

### RPC Endpoints

- **Devnet**: `https://api.devnet.solana.com`
- **Mainnet-Beta**: `https://api.mainnet-beta.solana.com`
- **Testnet**: `https://api.testnet.solana.com`

### Program Explorer

- **Devnet**: https://explorer.solana.com/address/GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV?cluster=devnet
- **Mainnet**: https://explorer.solana.com/address/GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV?cluster=mainnet-beta

## 📋 IDL (Interface Definition Language)

The complete IDL is available at:
- **Frontend**: `frontend/src/lib/blinkpay.json`
- **System**: `system/target/idl/blinkpay.json`

**IDL Structure:**
```json
{
  "version": "0.1.0",
  "name": "blinkpay",
  "instructions": [...],
  "accounts": [...],
  "types": [...],
  "events": [...],
  "errors": [...]
}
```