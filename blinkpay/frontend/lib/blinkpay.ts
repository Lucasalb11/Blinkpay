import { Buffer } from "buffer"
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor"
import type { AnchorWallet } from "@solana/wallet-adapter-react"
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import idl from "./idl/blinkpay.json"
import type { Blinkpay } from "./idl/blinkpay-types"

// Anchor and web3.js expect a global Buffer, which browsers don't provide.
if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: unknown }).Buffer) {
  ;(globalThis as { Buffer?: unknown }).Buffer = Buffer
}

export const PROGRAM_ID = new PublicKey(idl.address)
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com"

/** SOL is represented on-chain by the default pubkey. */
export const SOL_MINT = PublicKey.default
/** Circle's devnet USDC. */
export const USDC_DEVNET_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")

export const TOKENS = {
  SOL: { mint: SOL_MINT, decimals: 9, symbol: "SOL" },
  USDC: { mint: USDC_DEVNET_MINT, decimals: 6, symbol: "USDC" },
} as const
export type TokenSymbol = keyof typeof TOKENS

export function tokenForMint(mint: PublicKey) {
  return Object.values(TOKENS).find((t) => t.mint.equals(mint)) ?? { mint, decimals: 0, symbol: "tokens" }
}

export function toBaseUnits(amount: string, decimals: number): BN {
  const [whole, frac = ""] = amount.trim().split(".")
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals)
  return new BN(`${whole || "0"}${padded}`.replace(/^0+(?=\d)/, ""))
}

export function fromBaseUnits(amount: BN, decimals: number): string {
  const s = amount.toString().padStart(decimals + 1, "0")
  const whole = s.slice(0, s.length - decimals)
  const frac = s.slice(s.length - decimals).replace(/0+$/, "")
  return frac ? `${whole}.${frac}` : whole
}

export const connection = new Connection(RPC_ENDPOINT, "confirmed")

/** Read-only program for pages without a connected wallet. */
const readOnlyWallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async () => {
    throw new Error("Connect a wallet to sign")
  },
  signAllTransactions: async () => {
    throw new Error("Connect a wallet to sign")
  },
} as unknown as AnchorWallet

export function getProgram(wallet?: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet ?? readOnlyWallet, { commitment: "confirmed" })
  return new Program<Blinkpay>(idl as Blinkpay, provider)
}

export function paymentRequestPda(authority: PublicKey, recipient: PublicKey, amount: BN, nonce: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment_request"),
      authority.toBuffer(),
      recipient.toBuffer(),
      amount.toArrayLike(Buffer, "le", 8),
      nonce.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID,
  )[0]
}

export async function createPaymentRequest(
  wallet: AnchorWallet,
  params: { token: TokenSymbol; amount: string; memo: string },
) {
  const token = TOKENS[params.token]
  const amount = toBaseUnits(params.amount, token.decimals)
  // Any unique value works as the nonce; the program reads real time from the Clock sysvar.
  const nonce = new BN(Date.now())
  const pda = paymentRequestPda(wallet.publicKey, wallet.publicKey, amount, nonce)
  const signature = await getProgram(wallet)
    .methods.createPaymentRequest(amount, token.mint, wallet.publicKey, params.memo, nonce)
    .accountsPartial({ authority: wallet.publicKey, paymentRequest: pda })
    .rpc()
  return { pda, signature }
}

export async function payRequest(wallet: AnchorWallet, requestAddress: PublicKey) {
  const program = getProgram(wallet)
  const request = await program.account.paymentRequest.fetch(requestAddress)
  const isSol = request.tokenMint.equals(SOL_MINT)
  const recipientAta = getAssociatedTokenAddressSync(request.tokenMint, request.recipient)
  // The merchant may never have held this token: create their account in the same transaction.
  const pre = isSol
    ? []
    : [
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          recipientAta,
          request.recipient,
          request.tokenMint,
        ),
      ]
  return program.methods
    .payRequest()
    .preInstructions(pre)
    .accountsPartial({
      payer: wallet.publicKey,
      paymentRequest: requestAddress,
      recipient: isSol ? request.recipient : null,
      payerTokenAccount: isSol ? null : getAssociatedTokenAddressSync(request.tokenMint, wallet.publicKey),
      recipientTokenAccount: isSol ? null : recipientAta,
      tokenProgram: isSol ? null : TOKEN_PROGRAM_ID,
      associatedTokenProgram: null,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export type PaymentRequestAccount = Awaited<
  ReturnType<ReturnType<typeof getProgram>["account"]["paymentRequest"]["fetch"]>
>

/** Requests that pay into `recipient`. Recipient sits right after the 8-byte discriminator and 32-byte authority. */
export async function listRequestsFor(recipient: PublicKey) {
  const rows = await getProgram().account.paymentRequest.all([
    { memcmp: { offset: 8 + 32, bytes: recipient.toBase58() } },
  ])
  return rows.sort((a, b) => b.account.createdAt.toNumber() - a.account.createdAt.toNumber())
}

export function statusOf(request: PaymentRequestAccount): "pending" | "paid" | "cancelled" {
  if ("paid" in request.status) return "paid"
  if ("cancelled" in request.status) return "cancelled"
  return "pending"
}
