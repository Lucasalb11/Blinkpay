use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;
pub mod utils;

use instructions::*;
use state::ScheduledChargeType;

declare_id!("GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV");

#[program]
pub mod blinkpay {
    use super::*;

    /// Create a new payment request
    /// Allows users to request payments that can be fulfilled by anyone
    pub fn create_payment_request(
        ctx: Context<CreatePaymentRequest>,
        amount: u64,
        token_mint: Pubkey,
        recipient: Pubkey,
        memo: String,
        current_time: i64,
    ) -> Result<()> {
        instructions::create_payment_request(ctx, amount, token_mint, recipient, memo, current_time)
    }

    /// Pay a payment request
    /// Anyone can pay a pending payment request to fulfill it
    pub fn pay_request(ctx: Context<PayRequest>) -> Result<()> {
        instructions::pay_request(ctx)
    }

    /// Create a new scheduled charge
    /// Sets up automatic payments that execute at specified times
    pub fn create_scheduled_charge(
        ctx: Context<CreateScheduledCharge>,
        amount: u64,
        token_mint: Pubkey,
        recipient: Pubkey,
        execute_at: i64,
        charge_type: u8,
        interval_seconds: Option<u64>,
        max_executions: Option<u32>,
        memo: String,
        current_time: i64,
    ) -> Result<()> {
        instructions::create_scheduled_charge(
            ctx,
            amount,
            token_mint,
            recipient,
            execute_at,
            charge_type,
            interval_seconds,
            max_executions,
            memo,
            current_time,
        )
    }

    /// Execute a scheduled charge
    /// Can be called by anyone when the execution time has been reached
    pub fn execute_scheduled_charge(ctx: Context<ExecuteScheduledCharge>) -> Result<()> {
        instructions::execute_scheduled_charge(ctx)
    }

    /// Cancel a scheduled charge
    /// Only the authority can cancel their own charges
    pub fn cancel_scheduled_charge(ctx: Context<CancelScheduledCharge>) -> Result<()> {
        instructions::cancel_scheduled_charge(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
