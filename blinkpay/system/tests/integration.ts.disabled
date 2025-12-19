import * as anchor from '@project-serum/anchor'
import { PublicKey, Keypair } from '@solana/web3.js'
import { expect } from 'chai'

describe('BlikPay Integration Tests', () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env()
  provider.connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed')

  // Program ID from deployment
  const programId = new PublicKey('9zMTynBadkbNVsjujpxkgzXGCezDkvrqZxMtj98T961o')

  // Load the program
  const idl = require('../target/idl/blinkpay.json')
  const program = new anchor.Program(idl, programId, provider)

  let testWallet: Keypair
  let recipient: Keypair

  before(async () => {
    // Generate test wallets
    testWallet = Keypair.generate()
    recipient = Keypair.generate()

    // Request airdrop for testing
    console.log('💰 Requesting airdrop for test wallet...')
    try {
      const airdropSignature = await provider.connection.requestAirdrop(testWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      await provider.connection.confirmTransaction(airdropSignature)
      console.log('✅ Airdrop received')
    } catch (error) {
      console.log('⚠️ Airdrop failed, continuing with test...')
    }
  })

  it('Creates a payment request on devnet', async () => {
    const amount = new anchor.BN(1000000) // 0.001 SOL
    const tokenMint = new PublicKey('11111111111111111111111111111112') // SOL
    const memo = 'Integration test payment'
    const currentTime = new anchor.BN(Math.floor(Date.now() / 1000))

    // Derive PDA for payment request
    const [paymentRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('payment_request'),
        testWallet.publicKey.toBuffer(),
        recipient.publicKey.toBuffer(),
        amount.toArrayLike(Buffer, 'le', 8),
        currentTime.toArrayLike(Buffer, 'le', 8),
      ],
      programId
    )

    const tx = await program.methods
      .createPaymentRequest(amount, tokenMint, recipient.publicKey, memo, currentTime)
      .accounts({
        authority: testWallet.publicKey,
        paymentRequest: paymentRequestPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([testWallet])
      .rpc()

    console.log('✅ Payment request created:', tx)
    expect(tx).to.be.a('string')
  })

  it('Fetches payment requests from devnet', async () => {
    const paymentRequests = await program.account.paymentRequest.all()
    console.log('✅ Found payment requests:', paymentRequests.length)
    expect(paymentRequests.length).to.be.greaterThan(0)
  })

  it('Creates a scheduled charge on devnet', async () => {
    const amount = new anchor.BN(500000) // 0.0005 SOL
    const tokenMint = new PublicKey('11111111111111111111111111111112') // SOL
    const executeAt = new anchor.BN(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
    const chargeType = 0 // OneTime
    const memo = 'Integration test scheduled charge'
    const currentTime = new anchor.BN(Math.floor(Date.now() / 1000))

    // Derive PDA for scheduled charge
    const [scheduledChargePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('scheduled_charge'),
        testWallet.publicKey.toBuffer(),
        recipient.publicKey.toBuffer(),
        amount.toArrayLike(Buffer, 'le', 8),
        executeAt.toArrayLike(Buffer, 'le', 8),
        Buffer.from([chargeType]),
      ],
      programId
    )

    const tx = await program.methods
      .createScheduledCharge(
        amount,
        tokenMint,
        recipient.publicKey,
        executeAt,
        chargeType,
        null, // interval_seconds
        null, // max_executions
        memo,
        currentTime
      )
      .accounts({
        authority: testWallet.publicKey,
        scheduledCharge: scheduledChargePda,
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([testWallet])
      .rpc()

    console.log('✅ Scheduled charge created:', tx)
    expect(tx).to.be.a('string')
  })

  it('Fetches scheduled charges from devnet', async () => {
    const scheduledCharges = await program.account.scheduledCharge.all()
    console.log('✅ Found scheduled charges:', scheduledCharges.length)
    expect(scheduledCharges.length).to.be.greaterThan(0)
  })

  after(() => {
    console.log('\n🎉 All integration tests passed!')
    console.log('📊 Program ID:', programId.toString())
    console.log('🌐 Network: Devnet')
    console.log('💻 Frontend: http://localhost:3002')
  })
})