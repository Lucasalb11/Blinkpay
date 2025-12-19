---
sidebar_position: 1
---

# Welcome to Blinkpay

**Blinkpay** is a non-custodial payment and billing platform built on Solana, featuring instant payments, payment requests, and scheduled charges.

## 🚀 What is Blinkpay?

Blinkpay brings traditional payment UX to Web3 with Solana's speed and reliability. Our platform enables:

- **Instant Payments**: Send and receive SOL and PYUSD tokens instantly
- **Payment Requests**: Create shareable payment links that anyone can fulfill
- **Scheduled Charges**: Set up recurring payments and automated billing
- **Multi-wallet Support**: Compatible with Phantom, Solflare, Backpack, and more

## 🏗️ Architecture

Blinkpay consists of two main components:

### Smart Contract (Anchor Program)
- **Location**: `system/` directory
- **Technology**: Rust + Anchor framework
- **Network**: Solana blockchain
- **Features**: Core business logic, PDAs for deterministic addresses

### Frontend Application
- **Location**: `frontend/` directory
- **Technology**: Next.js + React + TypeScript
- **Features**: Modern web interface, wallet integration, real-time updates

## 🎯 Key Features

| Feature | Description | Status |
|---------|-------------|---------|
| Payment Requests | Create and fulfill payment requests | ✅ Implemented |
| Scheduled Charges | Set up recurring payments | ✅ Implemented |
| Multi-token Support | SOL and PYUSD tokens | ✅ Implemented |
| Wallet Integration | Phantom, Solflare, Backpack | ✅ Implemented |
| Responsive UI | Modern web interface | ✅ Implemented |

## 🛡️ Security & Trust

- **Non-custodial**: Your funds are never held by the platform
- **On-chain Logic**: All business rules enforced by smart contracts
- **Wallet Required**: All transactions require user signature
- **Open Source**: Fully auditable codebase

## 📚 Documentation Overview

This documentation is organized into several sections:

- **[Getting Started](./getting-started/overview.md)**: Quick setup and first steps
- **[User Guide](./user-guide/overview.md)**: How to use Blinkpay features
- **[Developer Guide](./developer-guide/overview.md)**: Technical implementation details
- **[API Reference](./api-reference/overview.md)**: Smart contract functions and interfaces

## 🌟 Why Blinkpay?

**For Users:**
- Fast, instant payments without intermediaries
- Familiar payment request experience
- Automated recurring billing
- Full control of your funds

**For Developers:**
- Clean, production-ready Solana program
- Comprehensive TypeScript integration
- Extensible architecture
- Security best practices

**For Businesses:**
- Lower transaction fees than traditional payment processors
- Global reach without currency conversion
- Automated subscription billing
- Integration with existing Solana ecosystem

---

Ready to get started? Check out our [Getting Started](./getting-started/overview.md) guide!
