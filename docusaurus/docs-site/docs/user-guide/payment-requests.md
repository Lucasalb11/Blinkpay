---
sidebar_position: 3
---

# Payment Requests

Learn how to create and manage payment requests in Blinkpay.

## Overview

Payment requests allow you to create shareable links that anyone can use to pay you. This is perfect for:

- **Freelancers**: Request payment for completed work
- **Merchants**: Generate payment links for customers
- **Donations**: Accept contributions from supporters
- **Invoices**: Send payment requests for goods/services

## Creating a Payment Request

### Step 1: Access Request Form

1. **Login to Blinkpay**: Connect your wallet
2. **Navigate to Requests**: Click "Payment Requests" in the sidebar
3. **Click "Create Request"**: Open the request creation form

### Step 2: Fill Request Details

| Field | Description | Required |
|-------|-------------|----------|
| **Amount** | Payment amount in SOL or PYUSD | Yes |
| **Token** | SOL or PYUSD | Yes |
| **Recipient** | Your wallet address (auto-filled) | Yes |
| **Memo** | Description or invoice details | No |
| **Expiry** | When request expires (optional) | No |

### Step 3: Generate Request

1. **Review Details**: Double-check all information
2. **Sign Transaction**: Approve in your wallet
3. **Get Shareable Link**: Copy the payment link

:::info Request Creation Fee
Creating a payment request costs ~0.001 SOL in network fees.
:::

## Managing Payment Requests

### View Active Requests

Access your dashboard to see all requests:

- **Pending**: Awaiting payment
- **Paid**: Successfully fulfilled
- **Expired**: Past expiry date
- **Cancelled**: Manually cancelled

### Request Details

Each request shows:

- **Request ID**: Unique identifier
- **Amount & Token**: Payment details
- **Status**: Current state
- **Created**: Timestamp
- **Shareable Link**: Payment URL

### Cancelling Requests

Cancel pending requests anytime:

1. **Find Request**: Locate in your dashboard
2. **Click Cancel**: Use the cancel button
3. **Confirm**: Sign cancellation transaction

:::warning Cancellation Policy
Cancelled requests cannot be reactivated. Create a new request instead.
:::

## Sharing Payment Links

### Shareable Link Format

Payment links follow this format:
```
https://blinkpay.app/pay/request/{request-id}
```

### Sharing Options

**Direct Link:**
- Copy and paste the URL
- Send via email, messaging apps
- Include in invoices or contracts

**QR Code:**
- Generate QR code for mobile payments
- Print for physical payments
- Display on websites or stores

**Integration:**
- Embed in websites
- Integrate with e-commerce platforms
- Use in social media posts

## Fulfilling Payment Requests

### For Payers

1. **Receive Link**: Get payment link from recipient
2. **Click Link**: Opens Blinkpay payment page
3. **Connect Wallet**: Select your wallet
4. **Review Details**: Verify amount and recipient
5. **Confirm Payment**: Sign transaction

### Payment Process

**SOL Payments:**
- Direct transfer to recipient
- Instant confirmation
- Low transaction fees

**PYUSD Payments:**
- SPL token transfer
- Automatic token account creation
- Same instant confirmation

### Payment Confirmation

After successful payment:

- **Transaction Hash**: View on Solana Explorer
- **Receipt**: Download payment confirmation
- **Status Update**: Request marked as "Paid"

## Advanced Features

### Bulk Requests

Create multiple requests at once:

1. **Upload CSV**: Import recipient list
2. **Batch Create**: Generate multiple requests
3. **Individual Links**: Get separate links for each

### Request Templates

Save frequently used request configurations:

1. **Create Template**: Save request settings
2. **Quick Access**: Use templates for faster creation
3. **Template Management**: Edit or delete saved templates

### Request Analytics

Track request performance:

- **Views**: How many times link was accessed
- **Conversion Rate**: Percentage of paid requests
- **Average Time**: Time to payment
- **Geographic Data**: Payment locations

## Security & Privacy

### Link Security

- **Unique URLs**: Each request has unique link
- **No Sensitive Data**: Links don't contain payment details
- **Secure Generation**: Cryptographically secure IDs

### Privacy Considerations

- **Public Ledger**: Payments are visible on Solana blockchain
- **Recipient Address**: Publicly visible in transactions
- **Memo Field**: Optional transaction descriptions

### Fraud Prevention

- **Request Validation**: Only original creator can cancel
- **Double Payment Prevention**: One-time payment per request
- **Expiry Protection**: Automatic expiration prevents stale requests

## Troubleshooting

### Request Creation Issues

**"Insufficient funds"**
- Ensure you have enough SOL for fees
- Check wallet balance
- Add funds if needed

**"Invalid amount"**
- Amounts must be greater than 0
- Check decimal places for tokens
- Verify token selection

**"Network error"**
- Check internet connection
- Try different RPC endpoint
- Wait and retry

### Link Sharing Problems

**"Link not working"**
- Verify link format and completeness
- Check for typos in URL
- Ensure request hasn't expired

**"Page not loading"**
- Clear browser cache
- Try different browser
- Check network connectivity

### Payment Issues

**"Payment failed"**
- Verify sufficient token balance
- Check wallet connection
- Ensure request is still valid

**"Wrong amount received"**
- Check token type (SOL vs PYUSD)
- Verify decimal conversion
- Contact recipient if incorrect

## Integration Examples

### E-commerce Integration

```javascript
// Example: Generate payment request for order
const createPaymentRequest = async (orderAmount, orderId) => {
  const request = await blinkpay.createRequest({
    amount: orderAmount,
    token: 'SOL',
    memo: `Order #${orderId}`,
    expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  })

  return request.paymentUrl
}
```

### API Integration

```typescript
// REST API example
const response = await fetch('/api/payment-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10,
    token: 'SOL',
    recipient: 'YourWalletAddress',
    memo: 'Service payment'
  })
})

const { paymentUrl } = await response.json()
```

## Best Practices

### Request Creation

- **Clear Descriptions**: Use descriptive memos
- **Reasonable Amounts**: Avoid extremely high amounts
- **Appropriate Expiry**: Set realistic timeframes

### Link Distribution

- **Secure Channels**: Share via trusted methods
- **QR Codes**: Use for mobile payments
- **Tracking**: Monitor link usage

### Customer Communication

- **Clear Instructions**: Explain payment process
- **Support Contact**: Provide help information
- **Confirmation**: Send payment confirmations

## API Reference

### Create Payment Request

```typescript
interface CreatePaymentRequestParams {
  amount: number          // Amount in token units
  token: 'SOL' | 'PYUSD'  // Token type
  recipient: string       // Recipient wallet address
  memo?: string          // Optional description
  expiry?: number        // Expiry timestamp (ms)
}

const request = await blinkpay.createPaymentRequest(params)
```

### Get Request Status

```typescript
const status = await blinkpay.getRequestStatus(requestId)
// Returns: 'pending' | 'paid' | 'expired' | 'cancelled'
```

### Cancel Request

```typescript
await blinkpay.cancelRequest(requestId)
```

---

Ready to try scheduled charges? Continue to [Scheduled Charges](scheduled-charges.md).