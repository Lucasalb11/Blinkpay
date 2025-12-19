---
sidebar_position: 2
---

# Wallet Connection

Learn how to connect your Solana wallet to Blinkpay and manage your wallet settings.

## Supported Wallets

Blinkpay supports all major Solana wallets:

### Desktop/Mobile Wallets
- **[Phantom](https://phantom.app/)** - Most popular Solana wallet
- **[Solflare](https://solflare.com/)** - Feature-rich mobile-first wallet
- **[Backpack](https://backpack.app/)** - Institutional-grade wallet
- **[Glow](https://glow.app/)** - User-friendly wallet option

### Hardware Wallets
- **Ledger** - Hardware wallet support (via Phantom/Solflare)
- **Trezor** - Hardware wallet support (via Solflare)

## Connecting Your Wallet

### Step 1: Install a Wallet

Choose and install one of the supported wallets:

**Phantom (Recommended for beginners):**
1. Visit [phantom.app](https://phantom.app/)
2. Download the browser extension
3. Create a new wallet or import existing one
4. Set up your password and backup seed phrase

**Solflare (Advanced features):**
1. Visit [solflare.com](https://solflare.com/)
2. Choose web or mobile version
3. Create wallet and securely store seed phrase

### Step 2: Fund Your Wallet

Before using Blinkpay, you need SOL for transaction fees:

**Devnet/Testnet:**
```bash
# Get test SOL from Solana faucet
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url https://api.devnet.solana.com
```

**Mainnet:**
- Purchase SOL from exchanges (Binance, Coinbase, etc.)
- Transfer SOL from another wallet
- Use on-ramp services

### Step 3: Connect to Blinkpay

1. **Open Blinkpay**: Navigate to the Blinkpay application
2. **Click Connect**: Click the "Connect Wallet" button in the top-right
3. **Select Wallet**: Choose your installed wallet from the popup
4. **Approve Connection**: Confirm the connection in your wallet

:::tip Auto-connect
Once connected, Blinkpay will remember your wallet and auto-connect on future visits.
:::

## Network Selection

Blinkpay supports multiple Solana networks:

### Available Networks

| Network | Purpose | RPC Endpoint |
|---------|---------|--------------|
| **Devnet** | Development and testing | `https://api.devnet.solana.com` |
| **Mainnet-Beta** | Production network | `https://api.mainnet-beta.solana.com` |
| **Testnet** | Limited testing | `https://api.testnet.solana.com` |

### Switching Networks

1. **Wallet Settings**: Open your wallet extension
2. **Developer Settings**: Enable developer mode if needed
3. **Network Selection**: Choose the desired network
4. **Refresh Blinkpay**: Reload the application to reconnect

:::warning Network Compatibility
Ensure your wallet is connected to the same network as the Blinkpay deployment you're using.
:::

## Wallet Management

### Viewing Account Balance

Your wallet balance is displayed in the Blinkpay dashboard:

- **SOL Balance**: Native Solana token
- **Token Balances**: PYUSD and other SPL tokens
- **Portfolio Value**: Total value in USD

### Transaction History

Access your complete transaction history:

1. **Wallet Extension**: Open your wallet
2. **Transaction Tab**: View all transactions
3. **Solana Explorer**: Click transaction hashes for details

### Security Settings

#### Enable 2FA (if supported)
Some wallets offer additional security:

1. **Wallet Settings**: Open security settings
2. **Enable 2FA**: Set up two-factor authentication
3. **Backup Codes**: Store backup codes securely

#### Export Private Key (Advanced)
⚠️ **Warning**: Never share your private key or seed phrase

For advanced users who need key export:

1. **Wallet Settings**: Access export options
2. **Verify Identity**: Complete security verification
3. **Export Key**: Use only for importing to another wallet

## Troubleshooting

### Connection Issues

**"Wallet not detected"**
- Ensure wallet extension is installed and enabled
- Try refreshing the page
- Check browser compatibility

**"Wrong network"**
- Verify wallet is connected to correct network
- Switch networks in wallet settings
- Refresh Blinkpay application

**"Connection timeout"**
- Check internet connection
- Try different RPC endpoint
- Clear browser cache and cookies

### Balance Issues

**"Insufficient funds"**
- Ensure you have enough SOL for transaction fees
- Check token balance for payments
- Verify correct token selection

**"Balance not updating"**
- Wait for transaction confirmation (30-60 seconds)
- Refresh the page
- Check transaction status on Solana Explorer

### Transaction Failures

**"Transaction rejected by user"**
- You cancelled the transaction in your wallet
- Try again and approve the transaction

**"Insufficient funds for fee"**
- You need more SOL for network fees
- Add SOL to your wallet

**"Program error"**
- Check Blinkpay status page
- Try again later
- Contact support if issue persists

## Advanced Features

### Multiple Wallets

Connect different wallets for different purposes:

1. **Disconnect Current**: Click wallet address → "Disconnect"
2. **Connect New Wallet**: Select different wallet
3. **Switch Between**: Use wallet selector dropdown

### Wallet Permissions

Blinkpay requests minimal permissions:

- **View Address**: Display your wallet address
- **View Balance**: Show account balances
- **Request Signatures**: Sign transactions

### Hardware Wallet Integration

For maximum security:

1. **Connect Hardware Wallet**: Pair with Phantom/Solflare
2. **Approve Transactions**: Confirm on hardware device
3. **Blind Signing**: Enable for smart contract interactions

## Security Best Practices

### Wallet Security
- **Strong Password**: Use complex password
- **Seed Phrase**: Store securely offline
- **Regular Backups**: Backup wallet regularly

### Transaction Safety
- **Verify Addresses**: Double-check recipient addresses
- **Check Amounts**: Review transaction details
- **Small Test First**: Test with small amounts

### Privacy Considerations
- **Address Reuse**: Consider new addresses for privacy
- **Public Ledger**: All transactions are visible
- **Memo Field**: Use memos to track purposes

## Getting Help

### Wallet Support
- **Phantom**: [Help Center](https://phantom.app/help)
- **Solflare**: [Support](https://solflare.com/support)
- **Backpack**: [Documentation](https://docs.backpack.app/)

### Blinkpay Support
- **Discord**: Join our community
- **GitHub**: Report issues
- **Documentation**: Check troubleshooting guides

---

Ready to make your first payment? Continue to [Payment Requests](payment-requests.md) or [Scheduled Charges](scheduled-charges.md).