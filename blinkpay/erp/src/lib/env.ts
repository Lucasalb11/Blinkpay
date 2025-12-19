/**
 * Environment Variables Configuration
 * Centralized env validation and access
 */

// Validate required environment variables
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getPublicEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value && typeof window !== 'undefined') {
    console.warn(`Missing public environment variable: ${key}`);
  }
  return value ?? '';
}

// App Configuration
export const APP_URL = getPublicEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
export const APP_NAME = getPublicEnvVar('NEXT_PUBLIC_APP_NAME', 'BlinkPay');

// Supabase Configuration
export const SUPABASE_URL = getPublicEnvVar('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getPublicEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Server-only Supabase key (never expose to client)
export const getServiceRoleKey = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Service role key cannot be accessed on the client');
  }
  return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
};

// Solana Configuration
export const SOLANA_RPC_URL = getPublicEnvVar(
  'NEXT_PUBLIC_SOLANA_RPC_URL',
  'https://api.mainnet-beta.solana.com'
);
export const SOLANA_NETWORK = getPublicEnvVar('NEXT_PUBLIC_SOLANA_NETWORK', 'mainnet-beta') as
  | 'mainnet-beta'
  | 'devnet'
  | 'testnet';

// Helius (Server-only)
export const getHeliusApiKey = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Helius API key cannot be accessed on the client');
  }
  return process.env.HELIUS_API_KEY ?? '';
};

export const getHeliusRpcUrl = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Helius RPC URL cannot be accessed on the client');
  }
  return process.env.HELIUS_RPC_URL ?? SOLANA_RPC_URL;
};

export const getHeliusWebhookSecret = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Helius webhook secret cannot be accessed on the client');
  }
  return process.env.HELIUS_WEBHOOK_SECRET ?? '';
};

// Token Mint Addresses
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112', // Native SOL wrapped
  USDC: getPublicEnvVar('NEXT_PUBLIC_USDC_MINT', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  PYUSD: getPublicEnvVar('NEXT_PUBLIC_PYUSD_MINT', '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
  USDT: getPublicEnvVar('NEXT_PUBLIC_USDT_MINT', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
} as const;

// Token decimals
export const TOKEN_DECIMALS = {
  SOL: 9,
  USDC: 6,
  PYUSD: 6,
  USDT: 6,
} as const;

export type SupportedToken = keyof typeof TOKEN_MINTS;
