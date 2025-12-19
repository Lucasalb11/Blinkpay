# BlinkPay Mobile 📱

A React Native mobile application for BlinkPay - Lightning-fast payments on Solana blockchain.

## 🚀 Features

### Core Functionality
- **🔐 Mobile Wallet Integration**: Support for Phantom, Solflare, and Solana Mobile Stack
- **💸 Direct Payments**: Send SOL or PYUSD tokens instantly
- **📝 Payment Requests**: Create shareable payment links
- **⏰ Scheduled Payments**: Automate recurring transactions
- **📊 Dashboard**: Clean mobile interface for all operations

### Mobile-First Design
- **🎨 Native UI**: Built with React Native Paper for consistent design
- **📱 Mobile Optimized**: Touch-friendly interface optimized for mobile
- **⚡ Fast Performance**: Optimized for mobile performance
- **🔔 Push Notifications**: Transaction confirmations and alerts
- **🔒 Security**: Biometric authentication support

## 🛠️ Tech Stack

**Framework & Language:**
- React Native 0.72.6
- TypeScript
- React Navigation

**Blockchain Integration:**
- @solana/wallet-adapter-react
- @solana/wallet-adapter-mobile
- @solana/web3.js

**UI & UX:**
- React Native Paper
- React Native Vector Icons
- React Native Safe Area Context

**Analytics & Monitoring:**
- PostHog (Analytics)
- Sentry (Error Monitoring)
- React Native Toast Message

## 📦 Installation

### Prerequisites

- Node.js 18+
- React Native development environment
- iOS Simulator or Android Emulator
- Solana wallet app on device/emulator

### Setup

1. **Install dependencies**
   ```bash
   cd mobile/BlinkPayMobile
   npm install
   ```

2. **iOS Setup** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android Setup**
   ```bash
   # Ensure Android SDK is configured
   ```

4. **Environment Configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env with your API keys
   ```

## 🚀 Running the App

### Development

```bash
# Start Metro bundler
npm start

# Run on iOS (macOS only)
npm run ios

# Run on Android
npm run android
```

### Production Build

```bash
# Build for iOS
npm run ios -- --configuration Release

# Build for Android
npm run android -- --variant release
```

## 📱 Usage Guide

### Wallet Connection

1. Open the app
2. Tap "Connect Wallet"
3. Choose your preferred wallet:
   - **Phantom**: QR code connection
   - **Solflare**: Mobile wallet integration
   - **Solana Mobile Stack**: Direct mobile wallet connection

### Making Payments

1. Navigate to "Send Payment"
2. Enter recipient address
3. Specify amount and token type
4. Add optional memo
5. Confirm transaction in wallet

### Creating Payment Requests

1. Go to "Request Payment"
2. Set amount and token type
3. Add description
4. Share generated link

### Scheduling Payments

1. Access "Schedule Payment"
2. Configure recipient and amount
3. Choose one-time or recurring
4. Set execution parameters

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Analytics
POSTHOG_API_KEY=your_posthog_key
POSTHOG_HOST=https://app.posthog.com

# Error Monitoring
SENTRY_DSN=your_sentry_dsn

# Blockchain
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
```

### Wallet Configuration

The app supports multiple wallet adapters:

- **Phantom**: QR code and deep linking
- **Solflare**: Direct mobile integration
- **Solana Mobile Stack**: Native mobile wallet support

## 🏗️ Project Structure

```
src/
├── App.tsx                    # Main app component
├── screens/                   # Screen components
│   ├── HomeScreen.tsx        # Main dashboard
│   ├── PaymentScreen.tsx     # Send payment
│   ├── RequestScreen.tsx     # Create payment request
│   └── ScheduledScreen.tsx   # Schedule payments
├── lib/                      # Core libraries
│   ├── WalletProvider.tsx    # Wallet context
│   ├── AnalyticsProvider.tsx # Analytics setup
│   └── config.ts            # App configuration
├── components/               # Reusable components
├── utils/                   # Utility functions
└── types/                   # TypeScript definitions
```

## 🔒 Security Features

### Mobile Security
- **Biometric Authentication**: Face ID / Touch ID support
- **Secure Storage**: Encrypted local storage for sensitive data
- **Certificate Pinning**: Network security
- **Runtime Security**: Code obfuscation in production

### Blockchain Security
- **Wallet Validation**: Secure wallet connection
- **Transaction Signing**: Secure transaction flow
- **Input Validation**: Client-side validation
- **Rate Limiting**: Prevent spam transactions

### Data Privacy
- **Minimal Data Collection**: Only essential analytics
- **GDPR Compliance**: User data control
- **Anonymous Analytics**: Privacy-focused tracking

## 📊 Analytics & Monitoring

### PostHog Integration
- User journey tracking
- Feature usage analytics
- Conversion funnel analysis
- A/B testing support

### Sentry Integration
- Real-time error monitoring
- Performance tracking
- Crash reporting
- Release health monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run e2e tests (detox)
npm run e2e
```

## 🚀 Deployment

### App Store Deployment

1. **iOS**
   ```bash
   # Build and submit to App Store
   npm run build:ios
   fastlane beta  # or production
   ```

2. **Google Play**
   ```bash
   # Build and submit to Play Store
   npm run build:android
   fastlane beta  # or production
   ```

### CI/CD

GitHub Actions workflow included for:
- Automated testing
- Build verification
- Release deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit pull request

### Code Style

- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- React Native best practices

## 📋 Roadmap

### Phase 1 ✅ (Current)
- Basic payment functionality
- Wallet integration
- Core UI/UX

### Phase 2 🔄 (Next)
- [ ] Advanced analytics
- [ ] Push notifications
- [ ] Biometric auth
- [ ] Offline support

### Phase 3 📋 (Future)
- [ ] P2P payments
- [ ] Multi-signature support
- [ ] DeFi integrations
- [ ] NFT marketplace

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
# Clear cache
npm start --reset-cache
```

**iOS build fails:**
```bash
# Clean and rebuild
cd ios && rm -rf build && cd ..
npm run ios
```

**Android build fails:**
```bash
# Clean gradle
cd android && ./gradlew clean && cd ..
npm run android
```

**Wallet connection issues:**
- Ensure wallet app is installed
- Check network connectivity
- Verify RPC endpoint

## 📄 License

ISC License - see LICENSE file for details.

## 📞 Support

- **Documentation**: [docs.blikpay.com](https://docs.blikpay.com)
- **Discord**: [discord.gg/blikpay](https://discord.gg/blikpay)
- **Issues**: [GitHub Issues](https://github.com/blikpay/mobile/issues)

---

**🎉 Ready for Mobile Payments**: BlinkPay Mobile brings the power of Solana payments to your pocket with a native, secure, and user-friendly experience! 📱✨