---
sidebar_position: 2
---

# Smart Contract Architecture

Deep dive into Blinkpay's Solana smart contract architecture, design decisions, and implementation details.

## Program Overview

Blinkpay's smart contract is built with the [Anchor framework](https://www.anchor-lang.com/) and follows Solana program best practices.

### Program ID
```
GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV
```

### Architecture Principles

1. **Non-Custodial**: No funds held by the program
2. **Permissionless Execution**: Anyone can execute scheduled charges
3. **Deterministic**: Same inputs produce same results
4. **Gas Efficient**: Optimized for Solana's constraints
5. **Secure**: Comprehensive input validation and access controls

## Core Data Structures

### PaymentRequest

Represents a payment request that can be fulfilled by anyone.

```rust
#[account]
pub struct PaymentRequest {
    pub authority: Pubkey,           // Request creator
    pub recipient: Pubkey,           // Intended recipient
    pub amount: u64,                 // Requested amount (lamports)
    pub token_mint: Pubkey,          // Token mint address
    pub memo: String,                // Optional description
    pub status: PaymentStatus,       // Current status
    pub created_at: i64,             // Creation timestamp
    pub paid_at: Option<i64>,        // Payment timestamp
}
```

**Space Calculation:**
- `authority`: 32 bytes
- `recipient`: 32 bytes
- `amount`: 8 bytes
- `token_mint`: 32 bytes
- `memo`: 4 + 200 = 204 bytes (max length)
- `status`: 1 byte (enum)
- `created_at`: 8 bytes
- `paid_at`: 1 + 8 = 9 bytes (Option)
- **Total**: 8 (discriminator) + 326 bytes ≈ 334 bytes

### ScheduledCharge

Represents a scheduled payment that executes automatically.

```rust
#[account]
pub struct ScheduledCharge {
    pub authority: Pubkey,           // Charge creator
    pub recipient: Pubkey,           // Payment recipient
    pub amount: u64,                 // Charge amount
    pub token_mint: Pubkey,          // Token mint
    pub charge_type: ChargeType,     // One-time or recurring
    pub execute_at: i64,             // Next execution time
    pub interval: Option<u64>,       // Recurring interval
    pub max_executions: Option<u32>, // Execution limit
    pub executions: u32,             // Completed executions
    pub status: ChargeStatus,        // Current status
    pub memo: String,                // Description
    pub created_at: i64,             // Creation timestamp
}
```

## Program Instructions

### Payment Request Instructions

#### `create_payment_request`

Creates a new payment request.

**Context:**
```rust
#[derive(Accounts)]
pub struct CreatePaymentRequest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

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

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}
```

**Logic:**
1. Validate inputs (amount > 0, valid token)
2. Initialize PaymentRequest account with provided data
3. Set status to `Pending`
4. Record creation timestamp

#### `pay_request`

Fulfills a payment request by transferring tokens.

**Context:**
```rust
#[derive(Accounts)]
pub struct PayRequest<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"payment_request",
            payment_request.authority.as_ref(),
            payment_request.recipient.as_ref(),
            &payment_request.amount.to_le_bytes(),
            &payment_request.created_at.to_le_bytes()
        ],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    // Token-specific accounts for SPL transfers
    pub token_program: Program<'info, Token>,
    // ... additional token accounts
}
```

**Logic:**
1. Verify request status is `Pending`
2. Check request hasn't expired (if expiry set)
3. Transfer tokens from payer to recipient
4. Update request status to `Paid`
5. Record payment timestamp

#### `cancel_payment_request`

Cancels a pending payment request.

**Validation:**
- Only authority can cancel
- Request must be `Pending`

### Scheduled Charge Instructions

#### `create_scheduled_charge`

Creates a new scheduled charge.

**Context:**
```rust
#[derive(Accounts)]
pub struct CreateScheduledCharge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ScheduledCharge::LEN,
        seeds = [
            b"scheduled_charge",
            authority.key().as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &execute_at.to_le_bytes(),
            &[charge_type.clone() as u8]
        ],
        bump
    )]
    pub scheduled_charge: Account<'info, ScheduledCharge>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}
```

#### `execute_scheduled_charge`

Executes a due scheduled charge (permissionless).

**Key Features:**
- Anyone can call this instruction
- Validates timing and balance requirements
- Handles both one-time and recurring charges
- Updates execution counters

## PDA Design

### Payment Request PDA

**Deterministic Address Generation:**
```
seeds = [
    "payment_request",
    authority_pubkey,
    recipient_pubkey,
    amount_u64_le_bytes,
    created_at_i64_le_bytes
]
```

**Benefits:**
- Unique per request parameters
- Authority can derive addresses client-side
- Prevents duplicate requests with same parameters

### Scheduled Charge PDA

**Seeds:**
```
seeds = [
    "scheduled_charge",
    authority_pubkey,
    recipient_pubkey,
    amount_u64_le_bytes,
    execute_at_i64_le_bytes,
    charge_type_u8
]
```

**Design Rationale:**
- Includes `charge_type` to allow different charge types
- `execute_at` in seeds prevents timing attacks
- Authority-based for permission management

## Security Measures

### Input Validation

**Comprehensive Checks:**
```rust
// Amount validation
require!(amount > 0, BlinkpayError::InvalidAmount);

// Address validation
require!(recipient != Pubkey::default(), BlinkpayError::InvalidRecipient);

// Time validation
let current_time = Clock::get()?.unix_timestamp;
require!(execute_at > current_time, BlinkpayError::InvalidTime);
```

### Access Control

**Authority Verification:**
```rust
// Only authority can cancel
require!(
    ctx.accounts.payment_request.authority == ctx.accounts.authority.key(),
    BlinkpayError::Unauthorized
);
```

**Program Authority:**
- Program owns all created accounts
- Cross-program invocation validation
- Account ownership verification

### Safe Arithmetic

**Overflow Protection:**
```rust
use anchor_lang::prelude::*;

// Automatic overflow checks with Anchor
let total_amount = amount.checked_mul(executions)
    .ok_or(BlinkpayError::ArithmeticOverflow)?;
```

## Error Handling

### Custom Error Types

```rust
#[error_code]
pub enum BlinkpayError {
    #[msg("Invalid amount provided")]
    InvalidAmount,

    #[msg("Unauthorized operation")]
    Unauthorized,

    #[msg("Payment request already paid")]
    AlreadyPaid,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
```

### Error Propagation

**Graceful Failure:**
- All errors revert entire transaction
- Clear error messages for debugging
- Consistent error codes across instructions

## Performance Optimizations

### Account Space Optimization

**Minimal Space Usage:**
- Fixed-size accounts for predictable costs
- Efficient serialization with Anchor
- Packed data structures

### Computational Efficiency

**Optimized Operations:**
- Minimal cross-program invocations
- Efficient PDA derivation
- Batched operations where possible

### Memory Management

**Stack Optimization:**
- Avoid large stack allocations
- Use heap allocation for large data
- Efficient borrowing patterns

## Testing Strategy

### Unit Tests

**Program Logic Testing:**
```rust
#[test]
fn test_create_payment_request() {
    let mut context = setup_test_context();
    let amount = 1_000_000; // 1 SOL

    // Test successful creation
    create_payment_request(&mut context, amount).unwrap();

    // Verify account state
    let payment_request = load_payment_request(&context);
    assert_eq!(payment_request.amount, amount);
    assert_eq!(payment_request.status, PaymentStatus::Pending);
}
```

### Integration Tests

**End-to-End Testing:**
```rust
#[test]
fn test_complete_payment_flow() {
    let mut context = setup_test_context();

    // Create request
    create_payment_request(&mut context, 1_000_000).unwrap();

    // Pay request
    pay_request(&mut context).unwrap();

    // Verify final state
    let payment_request = load_payment_request(&context);
    assert_eq!(payment_request.status, PaymentStatus::Paid);
    assert!(payment_request.paid_at.is_some());
}
```

### Fuzz Testing

**Input Validation Testing:**
- Random input generation
- Edge case testing
- Boundary condition verification

## Deployment Considerations

### Network Selection

**Environment Configuration:**
- **Devnet**: Testing and development
- **Mainnet-Beta**: Production deployment

### Program Upgrade

**Immutable by Design:**
- No upgrade authority set
- Logic frozen after audit
- New versions deployed separately

### Monitoring

**On-chain Monitoring:**
- Transaction success rates
- Account creation patterns
- Error frequency analysis

## Future Enhancements

### Potential Improvements

1. **Batch Operations**: Multiple requests in single transaction
2. **Conditional Payments**: Logic-based payment triggers
3. **Multi-token Support**: Enhanced SPL token handling
4. **Cross-Program Integration**: DeFi protocol integration

### Scalability Considerations

- **Account Limits**: Solana account size constraints
- **Transaction Limits**: Compute budget optimization
- **Network Congestion**: Fee market adaptation

## Code Examples

### Complete Payment Request Flow

```rust
// 1. Create payment request
pub fn create_payment_request(
    ctx: Context<CreatePaymentRequest>,
    amount: u64,
    token_mint: Pubkey,
    recipient: Pubkey,
    memo: String,
    current_time: i64,
) -> Result<()> {
    let payment_request = &mut ctx.accounts.payment_request;

    // Validate inputs
    require!(amount > 0, BlinkpayError::InvalidAmount);

    // Initialize account
    payment_request.authority = ctx.accounts.authority.key();
    payment_request.recipient = recipient;
    payment_request.amount = amount;
    payment_request.token_mint = token_mint;
    payment_request.memo = memo;
    payment_request.status = PaymentStatus::Pending;
    payment_request.created_at = current_time;
    payment_request.paid_at = None;

    Ok(())
}

// 2. Pay request
pub fn pay_request(ctx: Context<PayRequest>) -> Result<()> {
    let payment_request = &mut ctx.accounts.payment_request;

    // Validate state
    require!(
        payment_request.status == PaymentStatus::Pending,
        BlinkpayError::AlreadyPaid
    );

    // Transfer tokens (SOL example)
    **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? -= payment_request.amount;
    **ctx.accounts.recipient.try_borrow_mut_lamports()? += payment_request.amount;

    // Update state
    payment_request.status = PaymentStatus::Paid;
    payment_request.paid_at = Some(Clock::get()?.unix_timestamp);

    Ok(())
}
```

This architecture provides a robust, secure, and efficient foundation for Blinkpay's payment functionality on Solana.