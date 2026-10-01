use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;

use crate::errors::BlinkPayError;
use crate::state::{PaymentRequest, PaymentRequestStatus};
use crate::utils::*;

/// Accounts required for creating a payment request
#[derive(Accounts)]
#[instruction(amount: u64, token_mint: Pubkey, recipient: Pubkey, memo: String, nonce: i64)]
pub struct CreatePaymentRequest<'info> {
    /// The authority creating the payment request (payer)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The payment request account to be created
    #[account(
        init,
        payer = authority,
        space = PaymentRequest::LEN,
        seeds = [
            b"payment_request",
            authority.key().as_ref(),
            recipient.as_ref(),
            &amount.to_le_bytes(),
            &nonce.to_le_bytes()
        ],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    /// System program for account creation
    pub system_program: Program<'info, System>,

    /// Clock sysvar for timestamp
    pub clock: Sysvar<'info, Clock>,
}

/// Accounts required for paying a payment request
#[derive(Accounts)]
pub struct PayRequest<'info> {
    /// The payer fulfilling the payment request
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The payment request account
    #[account(
        mut,
        constraint = payment_request.status == PaymentRequestStatus::Pending @ BlinkPayError::PaymentRequestNotPending,
        constraint = payment_request.status != PaymentRequestStatus::Paid @ BlinkPayError::PaymentRequestAlreadyPaid,
        constraint = payment_request.status != PaymentRequestStatus::Cancelled @ BlinkPayError::PaymentRequestCancelled,
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    /// Recipient's SOL account (for SOL payments)
    #[account(
        mut,
        constraint = is_sol_token(&payment_request.token_mint) && recipient.key() == payment_request.recipient
    )]
    pub recipient: Option<AccountInfo<'info>>,

    /// Payer's token account (for SPL token payments)
    #[account(
        mut,
        constraint = !is_sol_token(&payment_request.token_mint)
    )]
    pub payer_token_account: Option<AccountInfo<'info>>,

    /// Recipient's token account (for SPL token payments)
    #[account(
        mut,
        constraint = !is_sol_token(&payment_request.token_mint)
    )]
    pub recipient_token_account: Option<AccountInfo<'info>>,

    /// Token program (for SPL token payments)
    pub token_program: Option<Program<'info, Token>>,

    /// Associated token program (for SPL token payments)
    pub associated_token_program: Option<Program<'info, AssociatedToken>>,

    /// System program (for SOL payments)
    pub system_program: Program<'info, System>,
}

/// Create a new payment request
/// This allows users to request payments that can be fulfilled by anyone
pub fn create_payment_request(
    ctx: Context<CreatePaymentRequest>,
    amount: u64,
    token_mint: Pubkey,
    recipient: Pubkey,
    memo: String,
    // Client-chosen value used only to make the PDA unique. Never trusted as time.
    _nonce: i64,
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;

    // SECURITY: Comprehensive input validation
    validate_amount(amount)?;
    validate_token_mint(&token_mint)?;
    validate_memo(&memo)?;
    // A merchant requesting payment to their own wallet is the main use case, so the
    // creator may also be the recipient. Anyone can pay the request.

    let payment_request = &mut ctx.accounts.payment_request;

    // Initialize the payment request
    payment_request.authority = *ctx.accounts.authority.key;
    payment_request.recipient = recipient;
    payment_request.amount = amount;
    payment_request.token_mint = token_mint;
    payment_request.memo = memo;
    payment_request.created_at = current_time;
    payment_request.status = PaymentRequestStatus::Pending;
    payment_request.bump = ctx.bumps.payment_request;

    msg!("Payment request created: {} lamports/tokens to {}", amount, recipient);

    Ok(())
}

/// Pay a payment request
/// Anyone can pay a pending payment request to fulfill it
pub fn pay_request(ctx: Context<PayRequest>) -> Result<()> {
    let payment_request = &mut ctx.accounts.payment_request;
    let amount = payment_request.amount;

    // Mark as paid first to prevent reentrancy
    payment_request.status = PaymentRequestStatus::Paid;

    if is_sol_token(&payment_request.token_mint) {
        // SOL payment
        let recipient = ctx.accounts.recipient.as_ref()
            .ok_or(BlinkPayError::InvalidRecipient)?;

        transfer_sol(
            &ctx.accounts.payer.to_account_info(),
            recipient,
            amount,
            &ctx.accounts.system_program.to_account_info(),
        )?;

        msg!("SOL payment completed: {} lamports to {}", amount, payment_request.recipient);
    } else {
        // SPL token payment
        let payer_token_account = ctx.accounts.payer_token_account.as_ref()
            .ok_or(BlinkPayError::InvalidTokenAccountOwner)?;
        let recipient_token_account = ctx.accounts.recipient_token_account.as_ref()
            .ok_or(BlinkPayError::InvalidAssociatedTokenAccount)?;
        let token_program = ctx.accounts.token_program.as_ref()
            .ok_or(BlinkPayError::InvalidTokenMint)?;

        // Both sides must hold the requested mint, and the destination must belong to the
        // recipient fixed at creation. Otherwise a payer could mark the request paid while
        // sending to their own account or paying in a worthless token.
        validate_token_account(payer_token_account, &ctx.accounts.payer.key(), &payment_request.token_mint)?;
        validate_token_account(recipient_token_account, &payment_request.recipient, &payment_request.token_mint)?;

        // Transfer tokens
        transfer_spl_tokens(
            payer_token_account,
            recipient_token_account,
            &ctx.accounts.payer.to_account_info(),
            &token_program.to_account_info(),
            amount,
        )?;

        msg!("SPL token payment completed: {} tokens to {}", amount, payment_request.recipient);
    }

    Ok(())
}
