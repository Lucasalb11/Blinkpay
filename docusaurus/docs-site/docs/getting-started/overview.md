---
sidebar_position: 1
---

# Getting Started with Blinkpay

Welcome to Blinkpay! This guide will help you get up and running with our payment platform quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

### System Requirements
- **Node.js**: Version 18.0 or higher
- **Rust**: Version 1.70 or higher (for smart contract development)
- **Anchor CLI**: Version 0.32.0 or higher
- **Solana CLI**: Latest version
- **Yarn or npm**: Package manager

### Development Tools
- **Git**: Version control system
- **Code Editor**: VS Code recommended with Rust and TypeScript extensions

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/blinkpay/blinkpay.git
cd blinkpay
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install smart contract dependencies
cd ../system
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV
```

### 4. Build and Deploy Smart Contract

```bash
cd system

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 5. Start the Frontend

```bash
cd ../frontend
npm run dev
```

Visit `http://localhost:3000` to see Blinkpay running locally!

## Development Workflow

### Local Development
1. **Smart Contract**: Use `anchor localnet` for local Solana network
2. **Frontend**: Use `npm run dev` for hot-reload development
3. **Testing**: Run `anchor test` for comprehensive test suite

### Production Deployment
1. **Smart Contract**: Deploy to mainnet-beta
2. **Frontend**: Deploy to Vercel, Netlify, or your preferred platform
3. **Monitoring**: Set up transaction monitoring and error tracking

## Wallet Setup

### Supported Wallets
- **Phantom**: Most popular Solana wallet
- **Solflare**: Feature-rich mobile-first wallet
- **Backpack**: Institutional-grade wallet
- **Glow**: User-friendly wallet option

### Getting Test SOL
For development and testing:

```bash
# Get devnet SOL from faucet
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url https://api.devnet.solana.com
```

## Next Steps

Now that you have Blinkpay running, you can:

1. **[Connect your wallet](../user-guide/wallet-connection.md)** to start using the platform
2. **[Create a payment request](../user-guide/payment-requests.md)** to receive payments
3. **[Set up scheduled charges](../user-guide/scheduled-charges.md)** for recurring billing
4. **[Explore the API](../developer-guide/smart-contracts.md)** for custom integrations

## Troubleshooting

### Common Issues

**Smart Contract Build Fails**
```bash
# Clear Anchor cache
anchor clean
anchor build
```

**Wallet Connection Issues**
- Ensure you're using a compatible browser (Chrome, Firefox, Edge)
- Check that your wallet extension is updated
- Verify you're on the correct network (devnet/mainnet)

**RPC Connection Problems**
- Check your internet connection
- Verify the RPC endpoint is accessible
- Consider using a different RPC provider

### Getting Help

- **Documentation**: Check the [User Guide](../user-guide/overview.md) and [Developer Guide](../developer-guide/overview.md)
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our community for real-time support

## Development Environment

### Recommended Setup

```bash
# VS Code extensions
code --install-extension rust-lang.rust-analyzer
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-solana.solana-extension-pack
```

### Environment Configuration

Create a `.env` file for your development setup:

```env
# Smart Contract
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json

# Frontend
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=GCdgRD3ss44Qyr9QpS3nj1u6UwbXnua8jU1EXazwyyPV
NEXT_PUBLIC_NETWORK=devnet
```

Congratulations! You're now ready to build with Blinkpay. 🎉