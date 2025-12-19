# BlikPay Frontend

A modern, responsive frontend for the BlikPay Solana payment platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **🔐 Wallet Integration**: Support for Phantom, Solflare, and Backpack wallets
- **💸 Direct Payments**: Send SOL or PYUSD tokens directly to any address
- **📝 Payment Requests**: Create shareable payment links with custom amounts and memos
- **⏰ Scheduled Payments**: Set up one-time or recurring automated payments
- **📊 Dashboard**: Comprehensive overview of all your payment activities
- **🔔 Real-time Notifications**: Toast notifications for all transaction states

### User Experience
- **🎨 Modern UI**: Clean, dark-mode-first design with Tailwind CSS
- **📱 Responsive**: Fully responsive design that works on all devices
- **⚡ Fast**: Optimized with Next.js 14 and efficient state management
- **🛡️ Error Handling**: Comprehensive error boundaries and graceful error states
- **🔄 Loading States**: Beautiful loading indicators throughout the app

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: React hooks
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Forms**: Native HTML5 validation + custom validation
- **Date Picker**: React DatePicker for scheduled payments
- **Testing**: Jest + React Testing Library

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Loading.tsx
│   │   └── ...
│   ├── modals/           # Modal components
│   │   ├── PaymentModal.tsx
│   │   ├── RequestModal.tsx
│   │   └── ScheduledModal.tsx
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── WalletButton.tsx  # Wallet connection button
│   ├── WalletProvider.tsx # Wallet context provider
│   └── ErrorBoundary.tsx # Error boundary component
└── lib/
    ├── blinkpay.ts       # Main SDK for interacting with smart contract
    ├── config.ts         # Configuration constants
    ├── utils.ts          # Utility functions
    └── idl.json          # Anchor IDL for the smart contract
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Solana wallet (Phantom, Solflare, or Backpack)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

### Build for Production

```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Solana network (devnet, testnet, mainnet-beta)
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Optional: Custom RPC endpoint
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Smart Contract Configuration

Update `src/lib/config.ts` with your deployed program ID and token mints:

```typescript
export const PROGRAM_ID = new PublicKey('your-program-id-here')
export const PYUSD_MINT = new PublicKey('your-pyusd-mint-here')
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📖 Usage Guide

### Connecting a Wallet

1. Click "Select Wallet" in the header
2. Choose your preferred Solana wallet
3. Approve the connection in your wallet

### Sending a Payment

1. Click "Send Payment" on the dashboard
2. Enter the recipient's Solana address
3. Specify amount and token type (SOL or PYUSD)
4. Add an optional memo
5. Confirm the transaction in your wallet

### Creating a Payment Request

1. Click "Request Payment" on the dashboard
2. Set the amount you want to receive
3. Choose token type
4. Add a description
5. Share the generated link with payers

### Scheduling Payments

1. Click "Schedule Payment" on the dashboard
2. Enter recipient address and payment details
3. Choose one-time or recurring payment
4. Set execution date/time
5. Configure frequency for recurring payments (optional)

## 🎯 Component Architecture

### Modal Components

All modals follow a consistent pattern:
- Form validation with real-time feedback
- Loading states during submission
- Error handling with user-friendly messages
- Responsive design with proper focus management

### Dashboard

The main dashboard provides:
- Quick action buttons for common tasks
- Overview statistics
- Recent activity feeds
- Pending action items (payments to make, executable charges)

### Error Handling

- **Error Boundaries**: Catch React errors and display recovery UI
- **Toast Notifications**: Real-time feedback for all operations
- **Form Validation**: Client-side validation with helpful error messages
- **Network Errors**: Graceful handling of blockchain transaction failures

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated on both client and smart contract
- **Amount Limits**: Minimum amounts enforced to prevent dust transactions
- **Address Validation**: Proper Solana address format checking
- **Memo Length Limits**: Prevent abuse with reasonable length limits
- **Future Timestamp Validation**: Ensure scheduled payments aren't set in the past

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

## 🐛 Troubleshooting

### Common Issues

**Wallet connection fails**
- Ensure your wallet extension is installed and updated
- Try refreshing the page and reconnecting

**Transaction fails**
- Check if you have sufficient funds
- Verify the recipient address is correct
- Ensure you're on the correct network

**Build fails**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## 📄 License

ISC License - see LICENSE file for details.