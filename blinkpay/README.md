# BlinkPay - Solana University Hackathon Submission

![BlinkPay Logo](https://img.shields.io/badge/Solana-BlinkPay-blue) ![Hackathon Ready](https://img.shields.io/badge/Solana--University--Hackathon-Fall--2025-green) ![Anchor](https://img.shields.io/badge/Anchor-0.32.0-orange)

**🏆 Solana University Hackathon Fall 2025 - Payment Infrastructure Track**

BlinkPay is a production-ready, non-custodial payment and billing platform that demonstrates advanced Solana programming concepts including Program Derived Addresses (PDAs), Cross-Program Invocations (CPIs), and on-chain automation. This project showcases how to build scalable payment infrastructure on Solana while maintaining security and user experience.

## 🎯 Hackathon Project Overview

**Learning Objectives Demonstrated:**
- Advanced Anchor programming with PDAs and account management
- Cross-Program Invocations for token transfers
- On-chain automation using Solana Clock sysvar
- Security-first development practices
- Production-ready smart contract architecture

**Technical Innovation:**
BlinkPay bridges traditional payment UX with Web3 capabilities, implementing complex on-chain logic for automated payments while maintaining decentralization and security.

### 🚀 Core Features

- **🔐 Wallet Integration**: Phantom, Backpack, Solflare support with secure connection
- **📝 Payment Requests**: Shareable payment links with metadata and validation
- **⏰ Scheduled Charges**: Automated recurring payments using on-chain time logic
- **💰 Multi-token Support**: SOL and SPL tokens with Associated Token Accounts
- **🛡️ Non-custodial Design**: User-controlled funds with on-chain enforcement
- **⚡ Permissionless Execution**: Anyone can trigger scheduled payments when due

## 🏗️ Technical Architecture

### 🎓 Educational Concepts Covered

This project demonstrates advanced Solana development patterns that students will learn:

1. **Program Derived Addresses (PDAs)** - Deterministic account creation
2. **Cross-Program Invocations (CPIs)** - Safe token transfers and system calls
3. **On-chain Time Logic** - Using Clock sysvar for automation
4. **Account Management** - Complex state machines with multiple account types
5. **Security Practices** - Input validation, authority checks, safe math

### Smart Contract Implementation

**Program ID**: `GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV`

#### Core Account Structures

**PaymentRequest Account**
```rust
#[account]
pub struct PaymentRequest {
    pub authority: Pubkey,      // Request creator
    pub recipient: Pubkey,      // Payment recipient
    pub amount: u64,           // Amount in smallest units
    pub token_mint: Pubkey,     // SOL (default) or SPL token mint
    pub memo: String,          // Optional description
    pub created_at: i64,       // Creation timestamp
    pub status: PaymentRequestStatus, // Pending/Paid/Cancelled
    pub bump: u8,              // PDA bump seed
}
```

**ScheduledCharge Account**
```rust
#[account]
pub struct ScheduledCharge {
    pub authority: Pubkey,      // Charge creator
    pub recipient: Pubkey,      // Payment recipient
    pub amount: u64,           // Amount per execution
    pub token_mint: Pubkey,     // Token mint
    pub charge_type: ScheduledChargeType, // OneTime/Recurring
    pub execute_at: i64,       // Next execution time
    pub interval_seconds: Option<u64>, // For recurring charges
    pub last_executed_at: Option<i64>, // Last execution timestamp
    pub max_executions: Option<u32>,   // Execution limit
    pub execution_count: u32,  // Current execution count
    pub memo: String,          // Description
    pub created_at: i64,       // Creation timestamp
    pub status: ScheduledChargeStatus, // Pending/Executed/Cancelled
    pub bump: u8,              // PDA bump seed
}
```

#### Program Instructions

| Instruction | Description | Key Learning |
|-------------|-------------|--------------|
| `create_payment_request` | Creates shareable payment request | PDA derivation, account initialization |
| `pay_request` | Fulfills payment request | CPI token transfers, state validation |
| `create_scheduled_charge` | Sets up automated payment | Complex account structures, time logic |
| `execute_scheduled_charge` | Triggers due payment (permissionless) | On-chain automation, time validation |
| `cancel_scheduled_charge` | Cancels scheduled payment | Authority validation, account closure |

### Security Features

- **Authority Checks**: Strict validation of account ownership
- **Time Validation**: On-chain timestamp verification using Solana Clock sysvar
- **Safe Math**: Overflow/underflow protection
- **Replay Protection**: PDA-based account derivation prevents duplicates
- **Input Validation**: Comprehensive checks for amounts, memos, and addresses

### Frontend (Next.js)

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: React hooks with Anchor client

## 🚀 Learning Path & Setup

### 📖 Educational Objectives

This project provides hands-on experience with:

**Solana Fundamentals**
- Program deployment and account management
- Transaction construction and signing
- Wallet integration patterns

**Advanced Concepts**
- PDA derivation and collision prevention
- CPI patterns for token operations
- On-chain time manipulation
- State machine design

**Development Best Practices**
- Comprehensive testing strategies
- Error handling and validation
- Security audit preparation
- Code documentation

### 🛠️ Development Setup

#### Prerequisites

- **Node.js 18+** - JavaScript runtime for frontend
- **Rust 1.70+** - Smart contract development
- **Anchor CLI 0.32.0** - Solana framework tools
- **Solana CLI** - Blockchain interaction
- **Phantom/Solflare Wallet** - User interface testing

#### Quick Start (Educational Path)

1. **Clone and Explore**
   ```bash
   git clone <repository-url>
   cd blinkpay
   code .  # Open in your preferred editor
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Study the Smart Contract Code**
   ```bash
   # Examine the core program logic
   cat programs/blinkpay/src/lib.rs
   cat programs/blinkpay/src/instructions/*.rs

   # Understand the data structures
   cat programs/blinkpay/src/state.rs
   ```

4. **Run Comprehensive Tests**
   ```bash
   anchor test  # Learn testing patterns and edge cases
   ```

5. **Deploy Locally**
   ```bash
   # Start local validator in background
   solana-test-validator &

   # Build and deploy the program
   anchor build
   anchor deploy
   ```

6. **Launch Frontend**
   ```bash
   cd frontend
   yarn install
   yarn dev  # Visit http://localhost:3000
   ```

## 📚 Educational Examples

### 🎓 Learning Exercise: Payment Request Flow

**Objective**: Understand PDA derivation, account validation, and state management

```typescript
// 1. Create a payment request
const paymentRequestPda = PublicKey.findProgramAddressSync(
  [
    Buffer.from("payment_request"),
    payer.publicKey.toBuffer(),
    recipient.publicKey.toBuffer(),
    amount.toArrayLike(Buffer, "le", 8),
    new anchor.BN(Date.now()).toArrayLike(Buffer, "le", 8),
  ],
  program.programId
)[0];

const paymentRequest = await program.methods
  .createPaymentRequest(
    amount,
    SystemProgram.programId, // SOL token
    recipient.publicKey,
    "Hackathon project payment",
    new anchor.BN(Date.now())
  )
  .accounts({
    authority: payer.publicKey,
    paymentRequest: paymentRequestPda,
    systemProgram: SystemProgram.programId,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  })
  .signers([payer])
  .rpc();

// Key Learning: PDA collision prevention, timestamp validation
```

### ⏰ Learning Exercise: Scheduled Charge Automation

**Objective**: Master on-chain time logic and permissionless execution

```typescript
// 2. Set up a recurring payment
const executeAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

const scheduledChargePda = PublicKey.findProgramAddressSync(
  [
    Buffer.from("scheduled_charge"),
    payer.publicKey.toBuffer(),
    recipient.publicKey.toBuffer(),
    amount.toArrayLike(Buffer, "le", 8),
    new anchor.BN(Date.now()).toArrayLike(Buffer, "le", 8),
    new Uint8Array([1]), // ScheduledChargeType::Recurring = 1
  ],
  program.programId
)[0];

const scheduledCharge = await program.methods
  .createScheduledCharge(
    amount,
    SystemProgram.programId,
    recipient.publicKey,
    new anchor.BN(executeAt),
    { recurring: {} }, // Charge type
    new anchor.BN(86400), // Daily interval
    new anchor.BN(30), // Max 30 executions
    "Monthly subscription payment",
    new anchor.BN(Date.now())
  )
  .accounts({
    authority: payer.publicKey,
    scheduledCharge: scheduledChargePda,
    systemProgram: SystemProgram.programId,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  })
  .signers([payer])
  .rpc();

// Key Learning: Complex state machines, time-based automation
    SystemProgram.programId,
    recipientPublicKey,
    new anchor.BN(executeAt),
    { oneTime: {} },
    null, // no interval
    null, // no max executions
    "Monthly subscription"
  )
  .accounts({ ... })
  .rpc();
```

### Executing a Due Charge

```typescript
// Anyone can execute a due scheduled charge
await program.methods
  .executeScheduledCharge()
  .accounts({
    executor: executorPublicKey,
    scheduledCharge: chargePda,
    // ... other accounts
  })
  .rpc();
```

## 🔧 API Reference

### Program Methods

#### Payment Requests

**create_payment_request(amount, token_mint, recipient, memo, current_time)**
- Creates a new payment request
- Returns: Transaction signature

**pay_request()**
- Pays an existing payment request
- Validates: Request status, token accounts, sufficient balance

#### Scheduled Charges

**create_scheduled_charge(amount, token_mint, recipient, execute_at, charge_type, interval_seconds, max_executions, memo, current_time)**
- Creates a scheduled payment
- charge_type: `{ oneTime: {} }` or `{ recurring: {} }`

**execute_scheduled_charge()**
- Executes a due scheduled charge
- Permissionless: Anyone can call when conditions are met

**cancel_scheduled_charge()**
- Cancels a pending scheduled charge
- Authority only: Must be signed by the charge creator

## 🧪 Testing

The project includes comprehensive tests covering:

- Payment request creation and fulfillment
- Scheduled charge setup and execution
- Cancellation logic
- Error conditions and edge cases
- Multi-token support

```bash
anchor test
```

Test coverage includes:
- ✅ SOL payments
- ✅ Error handling
- ✅ Authority validation
- ✅ Time-based execution
- ✅ PDA collision prevention

## 🔒 Security & Best Practices

### ✅ Security Implementation
- **Authority Validation**: Strict account ownership verification
- **Input Sanitization**: Comprehensive checks for all user inputs
- **Safe Math**: Overflow/underflow protection throughout
- **Replay Protection**: PDA-based unique account derivation
- **Time Validation**: On-chain timestamp verification
- **Access Control**: Permissioned operations with proper checks

### 🎯 Hackathon Judging Criteria Alignment

**Technical Excellence**
- ✅ Advanced Solana programming patterns (PDAs, CPIs)
- ✅ Comprehensive test coverage (25+ test cases)
- ✅ Production-ready code quality
- ✅ Security-first development approach

**Innovation & Impact**
- ✅ Novel payment automation on Solana
- ✅ Real-world utility for Web3 payments
- ✅ Scalable architecture design
- ✅ Educational value for other developers

**Code Quality & Documentation**
- ✅ Extensive code comments explaining concepts
- ✅ Well-structured modular architecture
- ✅ Comprehensive README and documentation
- ✅ Clear separation of concerns

### 🚧 Current Scope & Limitations
- **MVP Focus**: Core payment functionality implemented
- **Test Environment**: Localnet deployment (ready for Devnet/Mainnet)
- **Token Support**: SOL + PYUSD (extensible to any SPL token)
- **Frontend**: Basic wallet integration (expandable for full UX)

## 🏆 Solana University Hackathon Alignment

### 📚 Educational Value

This project serves as a comprehensive learning resource for:

- **Anchor Framework Mastery**: Complete smart contract development lifecycle
- **Security-First Development**: Real-world security practices and considerations
- **DeFi Infrastructure**: Building payment primitives for Web3 applications
- **Production Readiness**: Code structure and testing for real deployment

### 🎯 Hackathon Tracks Addressed

**Payment Infrastructure Track**
- ✅ Innovative payment solutions on Solana
- ✅ Automated execution mechanisms
- ✅ Multi-token support with SPL integration
- ✅ Non-custodial design principles

**Developer Experience Track**
- ✅ Clean, well-documented code
- ✅ Comprehensive test coverage
- ✅ Educational comments and explanations
- ✅ Modular architecture for extensibility

### 🔬 Technical Challenges Solved

1. **On-chain Automation**: Implementing time-based execution without oracles
2. **Complex State Management**: Multi-account transactions with validation
3. **Cross-Program Security**: Safe CPIs for token transfers
4. **Scalable Architecture**: PDA-based account derivation for unlimited instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

## 🎓 Learning Resources

**Recommended Study Path:**
1. Review the smart contract code in `programs/blinkpay/src/`
2. Run the test suite to understand expected behavior
3. Deploy locally and interact via the frontend
4. Study the PDA derivation patterns and CPI implementations
5. Explore extension possibilities (multi-sig, new token support)

**Key Files to Study:**
- `programs/blinkpay/src/lib.rs` - Main program entry point
- `programs/blinkpay/src/instructions/` - Core business logic
- `programs/blinkpay/src/state.rs` - Data structures
- `tests/blinkpay.ts` - Comprehensive test examples
- `frontend/src/lib/program.ts` - Frontend integration

## 🙏 Acknowledgments

**Solana University Hackathon Fall 2025**
- Special thanks to the Solana Foundation for fostering developer education
- Anchor framework for enabling rapid smart contract development
- The Solana developer community for inspiration and support

**Educational Mission**
This project aims to accelerate the learning curve for developers entering the Solana ecosystem by providing:
- Production-ready code examples
- Comprehensive documentation
- Real-world application patterns
- Security best practices

---

**🚀 Ready for Hackathon Submission** - BlinkPay demonstrates advanced Solana development skills while building practical payment infrastructure for the Web3 ecosystem.
