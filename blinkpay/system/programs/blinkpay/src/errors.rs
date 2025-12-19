use anchor_lang::prelude::*;

/// Custom errors for the BlinkPay program
#[error_code]
pub enum BlinkPayError {
    /// Payment request is not in pending status
    #[msg("Payment request is not pending")]
    PaymentRequestNotPending,

    /// Payment request has already been paid
    #[msg("Payment request has already been paid")]
    PaymentRequestAlreadyPaid,

    /// Payment request has been cancelled
    #[msg("Payment request has been cancelled")]
    PaymentRequestCancelled,

    /// Insufficient funds for payment
    #[msg("Insufficient funds for payment")]
    InsufficientFunds,

    /// Invalid token mint provided
    #[msg("Invalid token mint provided")]
    InvalidTokenMint,

    /// Scheduled charge is not in pending status
    #[msg("Scheduled charge is not pending")]
    ScheduledChargeNotPending,

    /// Scheduled charge has already been executed
    #[msg("Scheduled charge has already been executed")]
    ScheduledChargeAlreadyExecuted,

    /// Scheduled charge has been cancelled
    #[msg("Scheduled charge has been cancelled")]
    ScheduledChargeCancelled,

    /// Scheduled charge execution time has not been reached
    #[msg("Scheduled charge execution time has not been reached")]
    ExecutionTimeNotReached,

    /// Scheduled charge has exceeded maximum executions
    #[msg("Scheduled charge has exceeded maximum executions")]
    MaxExecutionsExceeded,

    /// Invalid authority for this operation
    #[msg("Invalid authority for this operation")]
    InvalidAuthority,

    /// Invalid recipient address
    #[msg("Invalid recipient address")]
    InvalidRecipient,

    /// Amount must be greater than zero
    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    /// Invalid timestamp provided
    #[msg("Invalid timestamp provided")]
    InvalidTimestamp,

    /// Invalid interval for recurring charge
    #[msg("Invalid interval for recurring charge")]
    InvalidInterval,

    /// Arithmetic overflow occurred
    #[msg("Arithmetic overflow occurred")]
    Overflow,

    /// Memo too long (max 200 characters)
    #[msg("Memo too long (max 200 characters)")]
    MemoTooLong,

    /// Token account not owned by expected owner
    #[msg("Token account not owned by expected owner")]
    InvalidTokenAccountOwner,

    /// Associated token account mismatch
    #[msg("Associated token account mismatch")]
    InvalidAssociatedTokenAccount,
}
