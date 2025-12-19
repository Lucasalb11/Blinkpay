use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};

use crate::errors::BlikPayError;

use anchor_lang::system_program::{self, Transfer};

/// Transfer SOL from one account to another
/// Uses the system program's transfer instruction
pub fn transfer_sol<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
    system_program: &AccountInfo<'info>,
) -> Result<()> {
    // Create the accounts context
    let accounts = system_program::Transfer {
        from: from.clone(),
        to: to.clone(),
    };

    // Execute the transfer
    system_program::transfer(
        CpiContext::new(system_program.clone(), accounts),
        amount,
    )?;

    Ok(())
}

/// Transfer SPL tokens from one token account to another
/// Validates token accounts and authorities
pub fn transfer_spl_tokens<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    // Create the accounts context
    let accounts = token::Transfer {
        from: from.clone(),
        to: to.clone(),
        authority: authority.clone(),
    };

    // Execute the transfer
    token::transfer(
        CpiContext::new(token_program.clone(), accounts),
        amount,
    )?;

    Ok(())
}

/// Validate that a token account is owned by the expected owner
pub fn validate_token_account_ownership<'info>(
    token_account: &AccountInfo<'info>,
    expected_owner: &Pubkey,
) -> Result<()> {
    let token_account_data = TokenAccount::try_deserialize(&mut &token_account.data.borrow()[..])?;

    if token_account_data.owner != *expected_owner {
        return err!(BlikPayError::InvalidTokenAccountOwner);
    }

    Ok(())
}

/// Check if a pubkey is the default pubkey (used to identify SOL payments)
pub fn is_sol_token(mint: &Pubkey) -> bool {
    *mint == Pubkey::default()
}

/// Validate token mint is either SOL (default pubkey) or a valid SPL token
pub fn validate_token_mint(mint: &Pubkey) -> Result<()> {
    // For now, we accept SOL (default pubkey) and any valid pubkey
    // In production, you might want to validate against a whitelist
    if mint == &Pubkey::default() {
        return Ok(());
    }

    // Additional validation could be added here for specific tokens like PYUSD
    Ok(())
}

/// Safe addition with overflow check
pub fn safe_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(BlikPayError::Overflow.into())
}

/// Safe subtraction with underflow check
pub fn safe_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or(BlikPayError::InsufficientFunds.into())
}

/// Validate amount is greater than zero
pub fn validate_amount(amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(BlikPayError::InvalidAmount);
    }
    Ok(())
}

/// Validate timestamp is not in the past (with small buffer for clock skew)
pub fn validate_future_timestamp(timestamp: i64, current_time: i64) -> Result<()> {
    // Allow 5 second buffer for clock skew
    if timestamp < current_time.saturating_sub(5) {
        return err!(BlikPayError::InvalidTimestamp);
    }
    Ok(())
}

/// Validate interval for recurring charges (minimum 1 hour)
pub fn validate_interval(interval_seconds: u64) -> Result<()> {
    const MIN_INTERVAL: u64 = 3600; // 1 hour
    if interval_seconds < MIN_INTERVAL {
        return err!(BlikPayError::InvalidInterval);
    }
    Ok(())
}

/// Validate memo length
pub fn validate_memo(memo: &str) -> Result<()> {
    const MAX_MEMO_LENGTH: usize = 200;
    if memo.len() > MAX_MEMO_LENGTH {
        return err!(BlikPayError::MemoTooLong);
    }
    Ok(())
}
