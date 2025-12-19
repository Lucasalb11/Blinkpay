import { PublicKey } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey('9zMTynBadkbNVsjujpxkgzXGCezDkvrqZxMtj98T961o')

// Common token mints
export const SOL_MINT = PublicKey.default
export const PYUSD_MINT = new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GX')

// PDAs
export const PDA_SEEDS = {
  PAYMENT_REQUEST: Buffer.from('payment_request'),
  SCHEDULED_CHARGE: Buffer.from('scheduled_charge'),
}

// Transaction fees (in lamports)
export const TX_FEES = {
  CREATE_PAYMENT_REQUEST: 5000,
  PAY_REQUEST: 5000,
  CREATE_SCHEDULED_CHARGE: 5000,
  EXECUTE_SCHEDULED_CHARGE: 5000,
  CANCEL_SCHEDULED_CHARGE: 5000,
}

// UI Constants
export const UI_CONSTANTS = {
  MAX_MEMO_LENGTH: 200,
  MIN_AMOUNT_SOL: 0.000001, // 1 lamport
  MAX_RETRIES: 3,
  CONFIRMATION_TIMEOUT: 60000, // 60 seconds
}