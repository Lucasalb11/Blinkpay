# BlikPay - Solana Payment & Billing Platform

![BlikPay Logo](https://img.shields.io/badge/Solana-BlikPay-blue) ![Hackathon Ready](https://img.shields.io/badge/Hackathon--Ready-2025-green) ![Anchor](https://img.shields.io/badge/Anchor-0.32.0-orange)

A non-custodial payment and billing platform on Solana featuring instant payments, payment requests, and scheduled charges.

## 🏗️ Project Structure

This project is organized into two main components:

```
blikpay/
├── system/          # Smart Contract (Anchor)
├── frontend/        # Web Application (Next.js)
├── README.md        # This file
└── .gitignore       # Root gitignore
```

### System (Backend/Smart Contract)
Located in `system/` directory:
- **Anchor Program**: Core Solana smart contract
- **Tests**: Comprehensive test suite
- **Migrations**: Deployment scripts
- **IDL**: Program interface definition

### Frontend (Web Application)
Located in `frontend/` directory:
- **Next.js App**: React-based web interface
- **Wallet Integration**: Solana wallet adapters
- **UI Components**: Modern, responsive design
- **Smart Contract Integration**: Direct program interaction

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Anchor CLI 0.32.0
- Solana CLI
- Yarn or npm

### 1. Clone and Setup
```bash
git clone <repository-url>
cd blikpay
```

### 2. Setup Smart Contract
```bash
cd system
yarn install
anchor build
anchor deploy
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- Smart Contract: Deployed to configured network

## 🔗 System Architecture & Connections

### Smart Contract ↔ Frontend Connection

The frontend connects to the smart contract through:

#### Program Configuration
- **Program ID**: `GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV`
- **Network**: Devnet (configurable)
- **IDL Location**: `system/target/idl/blinkpay.json`

#### Connection Flow
1. **Wallet Connection**: User connects Solana wallet (Phantom/Solflare)
2. **Program Initialization**: Frontend loads IDL and creates program instance
3. **Transaction Building**: User actions create transactions via Anchor
4. **On-chain Execution**: Transactions submitted to Solana network
5. **State Updates**: UI reflects on-chain state changes

#### Key Integration Points

```typescript
// Program connection (frontend/src/lib/program.ts)
const program = new Program(idl, PROGRAM_ID, provider)

// PDA derivation (consistent between frontend/backend)
const [pda] = PublicKey.findProgramAddressSync([...], PROGRAM_ID)

// Transaction execution
await program.methods.instructionName(params).rpc()
```

### Data Flow

```
User Action → Frontend → Wallet Signature → Smart Contract → On-chain State → UI Update
```

### Account Management

#### PDAs (Program Derived Addresses)
- **Payment Requests**: `payment_request` seed
- **Scheduled Charges**: `scheduled_charge` seed
- **Deterministic**: Same inputs = same address across frontend/backend

#### Token Handling
- **SOL**: Native SOL transfers
- **SPL Tokens**: Associated token accounts
- **Validation**: Mint address verification

## 🔒 Security & Best Practices

### Private Key Protection
- ✅ No private keys in repository
- ✅ `.gitignore` excludes sensitive files
- ✅ Environment variables for configuration
- ✅ Wallet files never committed

### Smart Contract Security
- ✅ Comprehensive input validation
- ✅ Authority checks on all operations
- ✅ Safe arithmetic operations
- ✅ Time-based execution validation

### Frontend Security
- ✅ Wallet signature required for transactions
- ✅ No server-side transaction signing
- ✅ User confirmation for all actions
- ✅ Input sanitization and validation

## 🧪 Testing & Development

### Smart Contract Tests
```bash
cd system
anchor test
```

### Frontend Development
```bash
cd frontend
npm run dev    # Development server
npm run build  # Production build
npm run lint   # Code linting
```

### Integration Testing
- Smart contract tests run in isolated environment
- Frontend can connect to localnet for testing
- End-to-end flows validated through test suite

## 📋 Available Features

### ✅ Implemented
- **Payment Requests**: Create and fulfill payment requests
- **Scheduled Charges**: Set up recurring payments
- **Multi-token Support**: SOL and PYUSD
- **Wallet Integration**: Phantom, Solflare, Backpack
- **Responsive UI**: Modern web interface
- **On-chain Logic**: All business rules enforced by smart contract

### 🚧 MVP Scope
- Payment request creation and fulfillment
- Scheduled charge setup and execution
- Basic transaction history view
- Wallet connection and management

## 🎯 Hackathon Submission

This project is optimized for:
- **Solana University Hackathon** (Fall 2025)
- **Superteam IndieFun Hackathon** ($10k Prize)

### Technical Excellence Demonstrated
- Clean, production-ready Solana program
- Modern, user-friendly web interface
- Comprehensive security practices
- Scalable architecture design

## 📚 Documentation

- **[Smart Contract](./system/README.md)**: Program details and API
- **[Frontend](./frontend/README.md)**: Web app setup and usage
- **[Security](./SECURITY.md)**: Security considerations
- **[Contributing](./CONTRIBUTING.md)**: Development guidelines

## 🤝 Contributing

1. Choose appropriate directory (`system/` or `frontend/`)
2. Follow existing code style and patterns
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request with clear description

## 📄 License

ISC License - see LICENSE file for details.

---

**BlikPay** - Bringing traditional payment UX to Web3 with Solana's speed and reliability.

For questions or support, please open an issue or start a discussion.
