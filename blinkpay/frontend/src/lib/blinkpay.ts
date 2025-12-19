import { Program, AnchorProvider, BN } from '@project-serum/anchor'
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction, Connection } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { PROGRAM_ID, PDA_SEEDS, SOL_MINT, PYUSD_MINT } from './config'
import idl from './idl.json'

// Types
export interface PaymentRequest {
  authority: PublicKey
  recipient: PublicKey
  amount: number
  tokenMint: PublicKey
  memo: string
  createdAt: number
  status: 'Pending' | 'Paid' | 'Cancelled'
  bump: number
}

export interface ScheduledCharge {
  authority: PublicKey
  recipient: PublicKey
  amount: number
  tokenMint: PublicKey
  chargeType: 'OneTime' | 'Recurring'
  executeAt: number
  intervalSeconds?: number
  lastExecutedAt?: number
  maxExecutions?: number
  executionCount: number
  memo: string
  createdAt: number
  status: 'Pending' | 'Executed' | 'Cancelled'
  bump: number
}

export interface CreatePaymentRequestParams {
  amount: number
  tokenMint?: PublicKey
  recipient: PublicKey
  memo?: string
}

export interface CreateScheduledChargeParams {
  amount: number
  tokenMint?: PublicKey
  recipient: PublicKey
  executeAt: number
  chargeType: 'OneTime' | 'Recurring'
  intervalSeconds?: number
  maxExecutions?: number
  memo?: string
}

export class BlinkPayClient {
  private program: Program
  private connection: Connection

  constructor(connection: Connection, wallet: any) {
    const provider = new AnchorProvider(connection, wallet, {})
    this.program = new Program(idl as any, PROGRAM_ID, provider)
    this.connection = connection
  }

  // Create payment request PDA
  private getPaymentRequestPda(
    authority: PublicKey,
    recipient: PublicKey,
    amount: number,
    createdAt: number
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        PDA_SEEDS.PAYMENT_REQUEST,
        authority.toBuffer(),
        recipient.toBuffer(),
        new BN(amount).toArrayLike(Buffer, 'le', 8),
        new BN(createdAt).toArrayLike(Buffer, 'le', 8),
      ],
      PROGRAM_ID
    )
  }

  // Create scheduled charge PDA
  private getScheduledChargePda(
    authority: PublicKey,
    recipient: PublicKey,
    amount: number,
    executeAt: number,
    chargeType: number
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        PDA_SEEDS.SCHEDULED_CHARGE,
        authority.toBuffer(),
        recipient.toBuffer(),
        new BN(amount).toArrayLike(Buffer, 'le', 8),
        new BN(executeAt).toArrayLike(Buffer, 'le', 8),
        Buffer.from([chargeType]),
      ],
      PROGRAM_ID
    )
  }

  // Create a new payment request
  async createPaymentRequest(params: CreatePaymentRequestParams): Promise<string> {
    const {
      amount,
      tokenMint = SOL_MINT,
      recipient,
      memo = ''
    } = params

    const authority = this.program.provider.publicKey!
    const createdAt = Math.floor(Date.now() / 1000)
    const [paymentRequestPda] = this.getPaymentRequestPda(authority, recipient, amount, createdAt)

    const tx = await this.program.methods
      .createPaymentRequest(
        new BN(amount),
        tokenMint,
        recipient,
        memo,
        new BN(createdAt)
      )
      .accounts({
        authority,
        paymentRequest: paymentRequestPda,
        systemProgram: SystemProgram.programId,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .rpc()

    return tx
  }

  // Pay a payment request
  async payRequest(paymentRequestPda: PublicKey): Promise<string> {
    const payer = this.program.provider.publicKey!
    const paymentRequest = await this.program.account.paymentRequest.fetch(paymentRequestPda)

    // Determine if it's SOL or SPL token
    const isSol = paymentRequest.tokenMint.equals(SOL_MINT)

    const accounts: any = {
      payer,
      paymentRequest: paymentRequestPda,
    }

    if (isSol) {
      // SOL payment
      accounts.recipient = paymentRequest.recipient
      accounts.systemProgram = SystemProgram.programId
    } else {
      // SPL token payment
      const payerTokenAccount = await getAssociatedTokenAddress(
        paymentRequest.tokenMint,
        payer
      )
      const recipientTokenAccount = await getAssociatedTokenAddress(
        paymentRequest.tokenMint,
        paymentRequest.recipient
      )

      accounts.payerTokenAccount = payerTokenAccount
      accounts.recipientTokenAccount = recipientTokenAccount
      accounts.tokenProgram = TOKEN_PROGRAM_ID
      accounts.associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID
      accounts.systemProgram = SystemProgram.programId
    }

    const tx = await this.program.methods
      .payRequest()
      .accounts(accounts)
      .rpc()

    return tx
  }

  // Create a scheduled charge
  async createScheduledCharge(params: CreateScheduledChargeParams): Promise<string> {
    const {
      amount,
      tokenMint = SOL_MINT,
      recipient,
      executeAt,
      chargeType,
      intervalSeconds,
      maxExecutions,
      memo = ''
    } = params

    const authority = this.program.provider.publicKey!
    const createdAt = Math.floor(Date.now() / 1000)
    const chargeTypeNum = chargeType === 'OneTime' ? 0 : 1

    const [scheduledChargePda] = this.getScheduledChargePda(
      authority,
      recipient,
      amount,
      executeAt,
      chargeTypeNum
    )

    const tx = await this.program.methods
      .createScheduledCharge(
        new BN(amount),
        tokenMint,
        recipient,
        new BN(executeAt),
        chargeTypeNum,
        intervalSeconds ? new BN(intervalSeconds) : null,
        maxExecutions ? new BN(maxExecutions) : null,
        memo,
        new BN(createdAt)
      )
      .accounts({
        authority,
        scheduledCharge: scheduledChargePda,
        systemProgram: SystemProgram.programId,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .rpc()

    return tx
  }

  // Execute a scheduled charge (permissionless)
  async executeScheduledCharge(scheduledChargePda: PublicKey): Promise<string> {
    const executor = this.program.provider.publicKey!
    const scheduledCharge = await this.program.account.scheduledCharge.fetch(scheduledChargePda)

    // Determine if it's SOL or SPL token
    const isSol = scheduledCharge.tokenMint.equals(SOL_MINT)

    const accounts: any = {
      executor,
      scheduledCharge: scheduledChargePda,
    }

    if (isSol) {
      // SOL payment
      accounts.authority = scheduledCharge.authority
      accounts.recipient = scheduledCharge.recipient
      accounts.systemProgram = SystemProgram.programId
    } else {
      // SPL token payment
      const authorityTokenAccount = await getAssociatedTokenAddress(
        scheduledCharge.tokenMint,
        scheduledCharge.authority
      )
      const recipientTokenAccount = await getAssociatedTokenAddress(
        scheduledCharge.tokenMint,
        scheduledCharge.recipient
      )

      accounts.authority = scheduledCharge.authority
      accounts.recipient = scheduledCharge.recipient
      accounts.authorityTokenAccount = authorityTokenAccount
      accounts.recipientTokenAccount = recipientTokenAccount
      accounts.tokenProgram = TOKEN_PROGRAM_ID
      accounts.associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID
      accounts.systemProgram = SystemProgram.programId
    }

    accounts.clock = SYSVAR_CLOCK_PUBKEY

    const tx = await this.program.methods
      .executeScheduledCharge()
      .accounts(accounts)
      .rpc()

    return tx
  }

  // Cancel a scheduled charge
  async cancelScheduledCharge(scheduledChargePda: PublicKey): Promise<string> {
    const authority = this.program.provider.publicKey!

    const tx = await this.program.methods
      .cancelScheduledCharge()
      .accounts({
        authority,
        scheduledCharge: scheduledChargePda,
      })
      .rpc()

    return tx
  }

  // Fetch payment request data
  async getPaymentRequest(paymentRequestPda: PublicKey): Promise<PaymentRequest> {
    const data = await this.program.account.paymentRequest.fetch(paymentRequestPda)
    return {
      authority: data.authority,
      recipient: data.recipient,
      amount: data.amount.toNumber(),
      tokenMint: data.tokenMint,
      memo: data.memo,
      createdAt: data.createdAt.toNumber(),
      status: ['Pending', 'Paid', 'Cancelled'][data.status] as any,
      bump: data.bump,
    }
  }

  // Fetch scheduled charge data
  async getScheduledCharge(scheduledChargePda: PublicKey): Promise<ScheduledCharge> {
    const data = await this.program.account.scheduledCharge.fetch(scheduledChargePda)
    return {
      authority: data.authority,
      recipient: data.recipient,
      amount: data.amount.toNumber(),
      tokenMint: data.tokenMint,
      chargeType: ['OneTime', 'Recurring'][data.chargeType] as any,
      executeAt: data.executeAt.toNumber(),
      intervalSeconds: data.intervalSeconds?.toNumber(),
      lastExecutedAt: data.lastExecutedAt?.toNumber(),
      maxExecutions: data.maxExecutions?.toNumber(),
      executionCount: data.executionCount,
      memo: data.memo,
      createdAt: data.createdAt.toNumber(),
      status: ['Pending', 'Executed', 'Cancelled'][data.status] as any,
      bump: data.bump,
    }
  }

  // Get all payment requests for a user
  async getUserPaymentRequests(userPubkey: PublicKey): Promise<PaymentRequest[]> {
    const paymentRequests = await this.program.account.paymentRequest.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: userPubkey.toBase58(),
        },
      },
    ])

    return paymentRequests.map(({ account, publicKey }) => ({
      authority: account.authority,
      recipient: account.recipient,
      amount: account.amount.toNumber(),
      tokenMint: account.tokenMint,
      memo: account.memo,
      createdAt: account.createdAt.toNumber(),
      status: ['Pending', 'Paid', 'Cancelled'][account.status] as any,
      bump: account.bump,
    }))
  }

  // Get all scheduled charges for a user
  async getUserScheduledCharges(userPubkey: PublicKey): Promise<ScheduledCharge[]> {
    const scheduledCharges = await this.program.account.scheduledCharge.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: userPubkey.toBase58(),
        },
      },
    ])

    return scheduledCharges.map(({ account }) => ({
      authority: account.authority,
      recipient: account.recipient,
      amount: account.amount.toNumber(),
      tokenMint: account.tokenMint,
      chargeType: ['OneTime', 'Recurring'][account.chargeType] as any,
      executeAt: account.executeAt.toNumber(),
      intervalSeconds: account.intervalSeconds?.toNumber(),
      lastExecutedAt: account.lastExecutedAt?.toNumber(),
      maxExecutions: account.maxExecutions?.toNumber(),
      executionCount: account.executionCount,
      memo: account.memo,
      createdAt: account.createdAt.toNumber(),
      status: ['Pending', 'Executed', 'Cancelled'][account.status] as any,
      bump: account.bump,
    }))
  }

  // Get pending payment requests to pay
  async getPendingRequestsToPay(userPubkey: PublicKey): Promise<PaymentRequest[]> {
    const paymentRequests = await this.program.account.paymentRequest.all()

    return paymentRequests
      .filter(({ account }) =>
        account.recipient.equals(userPubkey) &&
        account.status === 0 // Pending
      )
      .map(({ account }) => ({
        authority: account.authority,
        recipient: account.recipient,
        amount: account.amount.toNumber(),
        tokenMint: account.tokenMint,
        memo: account.memo,
        createdAt: account.createdAt.toNumber(),
        status: 'Pending',
        bump: account.bump,
      }))
  }

  // Get scheduled charges ready for execution
  async getExecutableScheduledCharges(): Promise<ScheduledCharge[]> {
    const scheduledCharges = await this.program.account.scheduledCharge.all()
    const currentTime = Math.floor(Date.now() / 1000)

    return scheduledCharges
      .filter(({ account }) =>
        account.status === 0 && // Pending
        account.executeAt.toNumber() <= currentTime
      )
      .map(({ account }) => ({
        authority: account.authority,
        recipient: account.recipient,
        amount: account.amount.toNumber(),
        tokenMint: account.tokenMint,
        chargeType: ['OneTime', 'Recurring'][account.chargeType] as any,
        executeAt: account.executeAt.toNumber(),
        intervalSeconds: account.intervalSeconds?.toNumber(),
        lastExecutedAt: account.lastExecutedAt?.toNumber(),
        maxExecutions: account.maxExecutions?.toNumber(),
        executionCount: account.executionCount,
        memo: account.memo,
        createdAt: account.createdAt.toNumber(),
        status: 'Pending',
        bump: account.bump,
      }))
  }
}

// React hook for using BlinkPay client
export function useBlinkPay() {
  const wallet = useWallet()

  const getClient = () => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected')
    }
    // Use a simple connection for now
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    return new BlinkPayClient(connection, wallet)
  }

  return { getClient }
}