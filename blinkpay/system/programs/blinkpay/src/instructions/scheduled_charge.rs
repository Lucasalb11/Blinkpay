use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;

use crate::errors::BlikPayError;
use crate::state::{ScheduledCharge, ScheduledChargeStatus, ScheduledChargeType};
use crate::utils::*;

/// Accounts required for creating a scheduled charge
#[derive(Accounts)]
#[instruction(amount: u64, token_mint: Pubkey, recipient: Pubkey, execute_at: i64, charge_type: u8, interval_seconds: Option<u64>, max_executions: Option<u32>, memo: String, current_time: i64)]
pub struct CreateScheduledCharge<'info> {
    /// The authority creating the scheduled charge
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The scheduled charge account to be created
    #[account(
        init,
        payer = authority,
        space = ScheduledCharge::LEN,
        seeds = [
            b"scheduled_charge",
            authority.key().as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &execute_at.to_le_bytes(),
            &[charge_type as u8],
        ],
        bump
    )]
    pub scheduled_charge: Account<'info, ScheduledCharge>,

    /// System program for account creation
    pub system_program: Program<'info, System>,

    /// Clock sysvar for timestamp validation
    pub clock: Sysvar<'info, Clock>,
}

/// Accounts required for executing a scheduled charge
#[derive(Accounts)]
pub struct ExecuteScheduledCharge<'info> {
    /// The executor (can be anyone)
    #[account(mut)]
    pub executor: Signer<'info>,

    /// The scheduled charge account
    #[account(
        mut,
        constraint = scheduled_charge.status == ScheduledChargeStatus::Pending @ BlikPayError::ScheduledChargeNotPending,
        constraint = scheduled_charge.status != ScheduledChargeStatus::Executed @ BlikPayError::ScheduledChargeAlreadyExecuted,
        constraint = scheduled_charge.status != ScheduledChargeStatus::Cancelled @ BlikPayError::ScheduledChargeCancelled,
    )]
    pub scheduled_charge: Account<'info, ScheduledCharge>,

    /// Authority's SOL account (for SOL payments)
    #[account(
        mut,
        signer,
        constraint = is_sol_token(&scheduled_charge.token_mint) && authority.key() == scheduled_charge.authority
    )]
    pub authority: Option<AccountInfo<'info>>,

    /// Recipient's SOL account (for SOL payments)
    #[account(
        mut,
        constraint = is_sol_token(&scheduled_charge.token_mint) && recipient.key() == scheduled_charge.recipient
    )]
    pub recipient: Option<AccountInfo<'info>>,

    /// Authority's token account (for SPL token payments)
    #[account(
        mut,
        constraint = !is_sol_token(&scheduled_charge.token_mint)
    )]
    pub authority_token_account: Option<AccountInfo<'info>>,

    /// Recipient's token account (for SPL token payments)
    #[account(
        mut,
        constraint = !is_sol_token(&scheduled_charge.token_mint)
    )]
    pub recipient_token_account: Option<AccountInfo<'info>>,

    /// Token program (for SPL token payments)
    pub token_program: Option<Program<'info, Token>>,

    /// Associated token program (for SPL token payments)
    pub associated_token_program: Option<Program<'info, AssociatedToken>>,

    /// System program (for SOL payments)
    pub system_program: Program<'info, System>,

    /// Clock sysvar for time validation
    pub clock: Sysvar<'info, Clock>,
}

/// Accounts required for cancelling a scheduled charge
#[derive(Accounts)]
pub struct CancelScheduledCharge<'info> {
    /// The authority cancelling the charge (must be the creator)
    #[account(
        mut,
        constraint = authority.key() == scheduled_charge.authority @ BlikPayError::InvalidAuthority
    )]
    pub authority: Signer<'info>,

    /// The scheduled charge account
    #[account(
        mut,
        constraint = scheduled_charge.status == ScheduledChargeStatus::Pending @ BlikPayError::ScheduledChargeNotPending,
        close = authority
    )]
    pub scheduled_charge: Account<'info, ScheduledCharge>,
}

/// Create a new scheduled charge
/// Sets up automatic payments that execute at specified times
pub fn create_scheduled_charge(
    ctx: Context<CreateScheduledCharge>,
    amount: u64,
    token_mint: Pubkey,
    recipient: Pubkey,
    execute_at: i64,
    charge_type_u8: u8,
    interval_seconds: Option<u64>,
    max_executions: Option<u32>,
    memo: String,
    current_time: i64,
) -> Result<()> {
    // SECURITY: Convert u8 to ScheduledChargeType with bounds checking
    let charge_type = match charge_type_u8 {
        0 => ScheduledChargeType::OneTime,
        1 => ScheduledChargeType::Recurring,
        _ => return err!(BlikPayError::InvalidTimestamp),
    };

    // SECURITY: Comprehensive input validation
    validate_scheduled_charge_params(
        amount,
        execute_at,
        max_executions,
        interval_seconds,
        current_time,
    )?;
    validate_token_mint(&token_mint)?;
    validate_memo(&memo)?;
    validate_recipient_not_authority(&recipient, &ctx.accounts.authority.key)?;

    let scheduled_charge = &mut ctx.accounts.scheduled_charge;

    // Initialize the scheduled charge
    scheduled_charge.authority = *ctx.accounts.authority.key;
    scheduled_charge.recipient = recipient;
    scheduled_charge.amount = amount;
    scheduled_charge.token_mint = token_mint;
    scheduled_charge.charge_type = charge_type;
    scheduled_charge.execute_at = execute_at;
    scheduled_charge.interval_seconds = interval_seconds;
    scheduled_charge.last_executed_at = None;
    scheduled_charge.max_executions = max_executions;
    scheduled_charge.execution_count = 0;
    scheduled_charge.memo = memo;
    scheduled_charge.created_at = current_time;
    scheduled_charge.status = ScheduledChargeStatus::Pending;
    scheduled_charge.bump = ctx.bumps.scheduled_charge;

    msg!("Scheduled charge created: {} lamports/tokens to {} at timestamp {}", amount, recipient, execute_at);

    Ok(())
}

/// Execute a scheduled charge
/// Can be called by anyone when the execution time has been reached
pub fn execute_scheduled_charge(ctx: Context<ExecuteScheduledCharge>) -> Result<()> {
    let scheduled_charge = &mut ctx.accounts.scheduled_charge;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // SECURITY: Restore time validation with buffer for clock skew
    if current_time < scheduled_charge.execute_at.saturating_sub(300) { // 5 minute buffer
        return err!(BlikPayError::ExecutionTimeNotReached);
    }

    // Check if already executed or cancelled
    if scheduled_charge.status != ScheduledChargeStatus::Pending {
        return err!(BlikPayError::ScheduledChargeNotPending);
    }

    // Check max executions for recurring charges
    if let Some(max_exec) = scheduled_charge.max_executions {
        if scheduled_charge.execution_count >= max_exec {
            return err!(BlikPayError::MaxExecutionsExceeded);
        }
    }

    let amount = scheduled_charge.amount;

    // SECURITY: Update state BEFORE transfer (Checks-Effects-Interactions pattern)
    // This prevents reentrancy attacks
    scheduled_charge.last_executed_at = Some(current_time);
    scheduled_charge.execution_count = scheduled_charge.execution_count.checked_add(1)
        .ok_or(BlikPayError::Overflow)?;

    // Handle recurring charges - calculate next execution time
    match scheduled_charge.charge_type {
        ScheduledChargeType::OneTime => {
            scheduled_charge.status = ScheduledChargeStatus::Executed;
        }
        ScheduledChargeType::Recurring => {
            // Calculate next execution time
            if let Some(interval) = scheduled_charge.interval_seconds {
                scheduled_charge.execute_at = current_time.checked_add(interval as i64)
                    .ok_or(BlikPayError::Overflow)?;

                // Check if we've reached max executions after increment
                if let Some(max_exec) = scheduled_charge.max_executions {
                    if scheduled_charge.execution_count >= max_exec {
                        scheduled_charge.status = ScheduledChargeStatus::Executed;
                    }
                }
            } else {
                // Recurring charge without interval should not exist, but handle gracefully
                scheduled_charge.status = ScheduledChargeStatus::Executed;
            }
        }
    }

    // SECURITY: Perform transfer AFTER state updates (Checks-Effects-Interactions)
    if is_sol_token(&scheduled_charge.token_mint) {
        // SOL payment
        let authority = ctx.accounts.authority.as_ref()
            .ok_or(BlikPayError::InvalidAuthority)?;
        let recipient = ctx.accounts.recipient.as_ref()
            .ok_or(BlikPayError::InvalidRecipient)?;

        transfer_sol(authority, recipient, amount, &ctx.accounts.system_program.to_account_info())?;
        msg!("SOL scheduled charge executed: {} lamports to {}", amount, scheduled_charge.recipient);
    } else {
        // SPL token payment
        let authority_token_account = ctx.accounts.authority_token_account.as_ref()
            .ok_or(BlikPayError::InvalidTokenAccountOwner)?;
        let recipient_token_account = ctx.accounts.recipient_token_account.as_ref()
            .ok_or(BlikPayError::InvalidAssociatedTokenAccount)?;
        let token_program = ctx.accounts.token_program.as_ref()
            .ok_or(BlikPayError::InvalidTokenMint)?;

        // Validate token account ownership
        validate_token_account_ownership(authority_token_account, &scheduled_charge.authority)?;

        // Transfer tokens
        transfer_spl_tokens(
            authority_token_account,
            recipient_token_account,
            ctx.accounts.authority.as_ref().unwrap(),
            &token_program.to_account_info(),
            amount,
        )?;
        msg!("SPL token scheduled charge executed: {} tokens to {}", amount, scheduled_charge.recipient);
    }

    Ok(())
}

/// Cancel a scheduled charge
/// Only the authority can cancel their own charges
pub fn cancel_scheduled_charge(ctx: Context<CancelScheduledCharge>) -> Result<()> {
    let scheduled_charge = &mut ctx.accounts.scheduled_charge;

    // Mark as cancelled
    scheduled_charge.status = ScheduledChargeStatus::Cancelled;

    msg!("Scheduled charge cancelled by authority");

    Ok(())
}
