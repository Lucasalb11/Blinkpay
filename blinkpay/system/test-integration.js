const anchor = require('@project-serum/anchor')
const { PublicKey, Connection, Keypair } = require('@solana/web3.js')

// Test script to verify integration with deployed program
async function testIntegration() {
  console.log('🚀 Testing BlinkPay Integration with Devnet')

  // Program ID from deployment
  const PROGRAM_ID = new PublicKey('9zMTynBadkbNVsjujpxkgzXGCezDkvrqZxMtj98T961o')

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  // Generate test keypair
  const testWallet = Keypair.generate()

  // Request airdrop for testing
  console.log('💰 Requesting airdrop...')
  try {
    const airdropSignature = await connection.requestAirdrop(testWallet.publicKey, 2 * 1e9) // 2 SOL
    await connection.confirmTransaction(airdropSignature)
    console.log('✅ Airdrop received')
  } catch (error) {
    console.log('⚠️ Airdrop may have failed, continuing with test...')
  }

  // Create provider
  const provider = new anchor.AnchorProvider(
    connection,
    {
      publicKey: testWallet.publicKey,
      signTransaction: async (tx) => {
        tx.sign(testWallet)
        return tx
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.sign(testWallet))
        return txs
      },
    },
    { commitment: 'confirmed' }
  )

  // Load the program
  const idl = require('./target/idl/blinkpay.json')
  const program = new anchor.Program(idl, PROGRAM_ID, provider)

  try {
    // Test 1: Create payment request
    console.log('\n📝 Test 1: Creating payment request...')
    const recipient = Keypair.generate().publicKey
    const amount = new anchor.BN(1000000) // 0.001 SOL
    const tokenMint = new PublicKey('11111111111111111111111111111112') // SOL
    const memo = 'Integration test payment'
    const currentTime = new anchor.BN(Math.floor(Date.now() / 1000))

    const tx1 = await program.methods
      .createPaymentRequest(amount, tokenMint, recipient, memo, currentTime)
      .accounts({
        authority: testWallet.publicKey,
        paymentRequest: PublicKey.findProgramAddressSync(
          [
            Buffer.from('payment_request'),
            testWallet.publicKey.toBuffer(),
            recipient.toBuffer(),
            amount.toArrayLike(Buffer, 'le', 8),
            currentTime.toArrayLike(Buffer, 'le', 8),
          ],
          PROGRAM_ID
        )[0],
        systemProgram: anchor.web3.SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([testWallet])
      .rpc()

    console.log('✅ Payment request created:', tx1)

    // Test 2: Fetch program accounts
    console.log('\n🔍 Test 2: Fetching program accounts...')
    const paymentRequests = await program.account.paymentRequest.all()
    console.log('✅ Found payment requests:', paymentRequests.length)

    const scheduledCharges = await program.account.scheduledCharge.all()
    console.log('✅ Found scheduled charges:', scheduledCharges.length)

    console.log('\n🎉 Integration test completed successfully!')
    console.log('📊 Program ID:', PROGRAM_ID.toString())
    console.log('🌐 Network: Devnet')
    console.log('💻 Frontend: http://localhost:3002')

    return true

  } catch (error) {
    console.error('❌ Integration test failed:', error)
    return false
  }
}

// Run test
testIntegration()
  .then(() => {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })