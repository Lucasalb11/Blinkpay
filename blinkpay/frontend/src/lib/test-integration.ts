import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { BlinkPayClient } from './blinkpay'
import { PROGRAM_ID, SOL_MINT } from './config'

// Test script to verify integration with deployed program
export async function testIntegration() {
  console.log('🚀 Testing BlinkPay Integration with Devnet')

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  // Generate test keypair (for testing only - never use in production)
  const testWallet = Keypair.generate()

  // Request airdrop for testing
  console.log('💰 Requesting airdrop...')
  const airdropSignature = await connection.requestAirdrop(testWallet.publicKey, 2 * 1e9) // 2 SOL
  await connection.confirmTransaction(airdropSignature)
  console.log('✅ Airdrop received')

  // Create client
  const client = new BlinkPayClient(connection, {
    publicKey: testWallet.publicKey,
    signTransaction: async (tx: any) => {
      tx.sign(testWallet)
      return tx
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach(tx => tx.sign(testWallet))
      return txs
    },
  })

  try {
    // Test 1: Create payment request
    console.log('\n📝 Test 1: Creating payment request...')
    const recipient = Keypair.generate().publicKey
    const amount = 1000000 // 0.001 SOL

    const tx1 = await client.createPaymentRequest({
      amount,
      tokenMint: SOL_MINT,
      recipient,
      memo: 'Integration test payment',
    })

    console.log('✅ Payment request created:', tx1)

    // Test 2: Fetch payment request
    console.log('\n🔍 Test 2: Fetching payment requests...')
    const requests = await client.getUserPaymentRequests(testWallet.publicKey)
    console.log('✅ Found payment requests:', requests.length)

    // Test 3: Create scheduled charge
    console.log('\n⏰ Test 3: Creating scheduled charge...')
    const executeAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

    const tx3 = await client.createScheduledCharge({
      amount,
      tokenMint: SOL_MINT,
      recipient,
      executeAt,
      chargeType: 'OneTime',
      memo: 'Integration test scheduled charge',
    })

    console.log('✅ Scheduled charge created:', tx3)

    // Test 4: Fetch scheduled charges
    console.log('\n🔍 Test 4: Fetching scheduled charges...')
    const charges = await client.getUserScheduledCharges(testWallet.publicKey)
    console.log('✅ Found scheduled charges:', charges.length)

    console.log('\n🎉 All integration tests passed!')
    console.log('📊 Program ID:', PROGRAM_ID.toString())
    console.log('🌐 Network: Devnet')
    console.log('💻 Frontend: http://localhost:3002')

    return true

  } catch (error) {
    console.error('❌ Integration test failed:', error)
    return false
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testIntegration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}