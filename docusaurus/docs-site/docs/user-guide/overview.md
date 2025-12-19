---
sidebar_position: 1
---

# User Guide

This guide will walk you through using Blinkpay's features to send and receive payments on Solana.

## 🔑 First Steps

### Connect Your Wallet

Before using Blinkpay, you need to connect a Solana-compatible wallet:

1. **Install a Wallet**: Download [Phantom](https://phantom.app/), [Solflare](https://solflare.com/), or [Backpack](https://backpack.app/)
2. **Fund Your Wallet**: Get test SOL from [Solana Faucet](https://faucet.solana.com/)
3. **Connect to Blinkpay**: Click "Connect Wallet" on the top-right corner

:::info Supported Wallets
Blinkpay supports all major Solana wallets including Phantom, Solflare, Backpack, Glow, and more.
:::

## 💰 Making Payments

### Instant Payments

Send SOL or PYUSD tokens instantly:

1. **Select Token**: Choose SOL or PYUSD from the dropdown
2. **Enter Amount**: Input the payment amount
3. **Enter Recipient**: Provide the recipient's Solana address
4. **Confirm Transaction**: Sign the transaction in your wallet

### Payment Requests

Request payments from others using shareable links:

1. **Create Request**: Click "Request Payment" in the dashboard
2. **Set Details**:
   - **Amount**: Payment amount required
   - **Token**: SOL or PYUSD
   - **Recipient**: Your wallet address (auto-filled)
   - **Memo**: Optional description
3. **Share Link**: Copy and share the payment link
4. **Track Status**: Monitor payment status in your dashboard

:::tip Payment Links
Payment request links are shareable and can be fulfilled by anyone with the link and sufficient funds.
:::

## ⏰ Scheduled Charges

### Setting Up Recurring Payments

Create automated recurring charges:

1. **Create Charge**: Click "Scheduled Charge" in the dashboard
2. **Configure Details**:
   - **Amount**: Charge amount per period
   - **Token**: SOL or PYUSD
   - **Recipient**: Where funds should be sent
   - **Schedule**: One-time or recurring
   - **Start Date**: When the first charge executes

### Charge Types

| Type | Description | Use Case |
|------|-------------|----------|
| **One-time** | Single scheduled payment | Future-dated payments |
| **Recurring** | Regular interval payments | Subscriptions, rent |
| **Conditional** | Triggered by external events | Milestone payments |

### Managing Charges

- **View Active Charges**: See all scheduled charges in your dashboard
- **Cancel Charges**: Cancel pending or recurring charges
- **Modify Amounts**: Update charge amounts (future charges only)

:::warning Cancellation Policy
Once a charge is executed on-chain, it cannot be reversed. Only cancel pending charges.
:::

## 📊 Dashboard Overview

### Payment History

Track all your transactions:

- **Incoming Payments**: Payments received via requests
- **Outgoing Payments**: Payments you've sent
- **Scheduled Charges**: Active and completed charges
- **Transaction Status**: Pending, confirmed, or failed

### Analytics

Monitor your payment activity:

- **Total Volume**: Sum of all transactions
- **Success Rate**: Percentage of successful payments
- **Token Breakdown**: Distribution by token type
- **Time Trends**: Payment activity over time

## 🔒 Security Best Practices

### Wallet Security
- **Never share your seed phrase**: Keep your recovery phrase secure
- **Use hardware wallets**: For large amounts, consider Ledger or Trezor
- **Enable 2FA**: If your wallet supports it

### Transaction Safety
- **Verify addresses**: Always double-check recipient addresses
- **Check amounts**: Review transaction details before signing
- **Monitor activity**: Regularly check your transaction history

### Privacy Considerations
- **Public ledger**: All transactions are visible on Solana explorer
- **Address reuse**: Consider using new addresses for privacy
- **Memo field**: Use memos to track transaction purposes

## 🆘 Troubleshooting

### Common Issues

**Transaction Failed**
- Check if you have sufficient balance
- Verify network congestion and gas fees
- Ensure recipient address is valid

**Wallet Not Connecting**
- Refresh the page and try again
- Check wallet extension is enabled
- Verify you're on the correct network

**Payment Request Not Working**
- Ensure the link is complete and not truncated
- Check if the request hasn't expired
- Verify the requested amount is reasonable

### Getting Support

- **Transaction Explorer**: Use [Solana Explorer](https://explorer.solana.com/) to check transaction status
- **Wallet Support**: Contact your wallet provider for wallet-specific issues
- **Community Help**: Join our Discord for community support

## 🎯 Advanced Features

### Bulk Payments

Send payments to multiple recipients:

1. **Upload CSV**: Import recipient list with addresses and amounts
2. **Review Batch**: Verify all transactions before execution
3. **Execute**: Sign and send all transactions at once

### Payment Templates

Save frequently used payment configurations:

- **Save Template**: Create reusable payment setups
- **Quick Access**: Use templates for faster payments
- **Template Management**: Edit or delete saved templates

### Integration Options

Connect Blinkpay with other services:

- **API Access**: Use our REST API for programmatic access
- **Webhooks**: Receive notifications for payment events
- **Export Data**: Download transaction history as CSV/JSON

---

Ready to start using Blinkpay? [Connect your wallet](../getting-started/overview.md#wallet-setup) and create your first payment!