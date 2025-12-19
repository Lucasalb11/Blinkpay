import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { PROGRAM_ID, RPC_ENDPOINT, DEFAULT_COMMITMENT } from './config'

// Import the IDL (this will be generated from the smart contract)
// Note: This path assumes the IDL is copied to the frontend after building the smart contract
import idlRaw from '../idl/blinkpay.json'
const idl = idlRaw as Idl

export type BlikPayProgram = Program<Idl>

// Connection singleton
let _connection: Connection | null = null

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_ENDPOINT, {
      commitment: DEFAULT_COMMITMENT,
      confirmTransactionInitialTimeout: 60000,
    })
  }
  return _connection
}

// Provider singleton
let _provider: AnchorProvider | null = null

export function getProvider(wallet?: any): AnchorProvider {
  if (!_provider || wallet) {
    const connection = getConnection()
    _provider = new AnchorProvider(
      connection,
      wallet || (window as any).solana,
      { commitment: DEFAULT_COMMITMENT }
    )
  }
  return _provider
}

// Create a new program instance
export function getProgram(wallet?: any): BlikPayProgram {
  const connection = getConnection()
  const provider = new AnchorProvider(connection, wallet || (typeof window !== 'undefined' ? (window as any).solana : undefined), { commitment: 'confirmed' })
  // @ts-ignore - Anchor version compatibility issue
  return new Program(idl as any, PROGRAM_ID.toString(), provider) as BlikPayProgram
}

// React hook for program access
export function useProgram(): BlikPayProgram {
  const { wallet } = useWallet()
  return getProgram(wallet)
}

// Utility functions for PDA derivation
export function getPaymentRequestPda(
  authority: PublicKey,
  recipient: PublicKey,
  amount: number,
  createdAt: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('payment_request'),
      authority.toBuffer(),
      recipient.toBuffer(),
      new anchor.BN(amount).toArrayLike(Buffer, 'le', 8),
      new anchor.BN(createdAt).toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  )
}

export function getScheduledChargePda(
  authority: PublicKey,
  recipient: PublicKey,
  amount: number,
  executeAt: number,
  chargeType: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('scheduled_charge'),
      authority.toBuffer(),
      recipient.toBuffer(),
      new anchor.BN(amount).toArrayLike(Buffer, 'le', 8),
      new anchor.BN(executeAt).toArrayLike(Buffer, 'le', 8),
      new Uint8Array([chargeType]),
    ],
    PROGRAM_ID
  )
}

// Import anchor for BN usage
import * as anchor from '@coral-xyz/anchor'
