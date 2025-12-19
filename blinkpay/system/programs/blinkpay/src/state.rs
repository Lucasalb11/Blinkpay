use anchor_lang::prelude::*;

/// Status of a payment request
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentRequestStatus {
    Pending,
    Paid,
    Cancelled,
}

/// Status of a scheduled charge
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ScheduledChargeStatus {
    Pending,
    Executed,
    Cancelled,
}

/// Type of scheduled charge
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ScheduledChargeType {
    OneTime,
    Recurring,
}

/// Payment request account
/// Stores information about a payment request that can be paid by anyone
#[account]
pub struct PaymentRequest {
    /// The creator/owner of the payment request
    pub authority: Pubkey,
    /// The recipient who should receive the payment
    pub recipient: Pubkey,
    /// Amount to be paid (in smallest units)
    pub amount: u64,
    /// Token mint (Pubkey::default() for SOL)
    pub token_mint: Pubkey,
    /// Optional memo/description
    pub memo: String,
    /// Timestamp when request was created
    pub created_at: i64,
    /// Status of the payment request
    pub status: PaymentRequestStatus,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

/// Scheduled charge account
/// Stores information about payments that execute automatically based on time conditions
#[account]
pub struct ScheduledCharge {
    /// The creator/owner of the scheduled charge
    pub authority: Pubkey,
    /// The recipient who should receive the payment
    pub recipient: Pubkey,
    /// Amount to be paid per execution (in smallest units)
    pub amount: u64,
    /// Token mint (Pubkey::default() for SOL)
    pub token_mint: Pubkey,
    /// Type of scheduled charge
    pub charge_type: ScheduledChargeType,
    /// Timestamp when the charge should first execute
    pub execute_at: i64,
    /// For recurring charges: interval between executions (in seconds)
    pub interval_seconds: Option<u64>,
    /// Timestamp of last execution (None if never executed)
    pub last_executed_at: Option<i64>,
    /// Maximum number of executions (None for unlimited recurring)
    pub max_executions: Option<u32>,
    /// Current execution count
    pub execution_count: u32,
    /// Optional memo/description
    pub memo: String,
    /// Timestamp when charge was created
    pub created_at: i64,
    /// Status of the scheduled charge
    pub status: ScheduledChargeStatus,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl PaymentRequest {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // recipient
        8 + // amount
        32 + // token_mint
        (4 + 200) + // memo (max 200 chars)
        8 + // created_at
        1 + // status
        1; // bump
}

impl ScheduledCharge {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // recipient
        8 + // amount
        32 + // token_mint
        1 + // charge_type
        8 + // execute_at
        (1 + 8) + // interval_seconds
        (1 + 8) + // last_executed_at
        (1 + 4) + // max_executions
        4 + // execution_count
        (4 + 200) + // memo (max 200 chars)
        8 + // created_at
        1 + // status
        1; // bump
}
