import { PublicKey } from '@solana/web3.js'

// Program Configuration
export const PROGRAM_ID = new PublicKey('GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV')

// Network Configuration
export const NETWORK = 'devnet' // 'devnet', 'mainnet-beta', 'localnet'
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  `https://api.${NETWORK}.solana.com`

// Token Configuration
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

// PYUSD Mint (example - replace with actual PYUSD mint)
export const PYUSD_MINT = new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo')

// Supported tokens
export const SUPPORTED_TOKENS = [
  {
    name: 'SOL',
    symbol: 'SOL',
    mint: SOL_MINT,
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    name: 'PayPal USD',
    symbol: 'PYUSD',
    mint: PYUSD_MINT,
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/31212/standard/PYUSD_Logo_%282%29.png'
  }
]

// PDA Seeds
export const PAYMENT_REQUEST_SEED = 'payment_request'
export const SCHEDULED_CHARGE_SEED = 'scheduled_charge'

// Default transaction settings
export const DEFAULT_COMMITMENT = 'confirmed'
export const DEFAULT_CONFIRMATION_TIMEOUT = 30000 // 30 seconds

// Fee estimation
export const ESTIMATED_FEE_SOL = 0.000005 // SOL
export const ESTIMATED_FEE_LAMPORTS = ESTIMATED_FEE_SOL * 1_000_000_000

// UI Constants
export const MAX_MEMO_LENGTH = 200
export const MIN_AMOUNT = 0.000001 // SOL
export const MAX_AMOUNT = 1000 // SOL
