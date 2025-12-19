---
sidebar_position: 4
---

# Scheduled Charges

Learn how to create and manage automated recurring payments and scheduled charges in Blinkpay.

## Overview

Scheduled charges enable automatic payments at specified times, perfect for:

- **Subscriptions**: Monthly service payments
- **Rent**: Regular rent payments
- **Billings**: Automated invoicing
- **Savings**: Regular transfers to savings
- **Investments**: Periodic investment contributions

## Types of Scheduled Charges

### One-time Charges

Single payments scheduled for a future date:

- **Future Payments**: Pay bills in advance
- **Delayed Transfers**: Schedule transfers for specific dates
- **Pre-scheduled**: Set up payments ahead of time

### Recurring Charges

Regular, automated payments at intervals:

- **Subscriptions**: Weekly, monthly, or yearly payments
- **Rent**: Monthly rent payments
- **Services**: Ongoing service fees
- **Savings**: Regular savings deposits

## Creating a Scheduled Charge

### Step 1: Access Charge Form

1. **Connect Wallet**: Ensure wallet is connected
2. **Navigate to Charges**: Click "Scheduled Charges"
3. **Click "Create Charge"**: Open creation form

### Step 2: Configure Charge Details

#### Basic Settings

| Field | Description | Required |
|-------|-------------|----------|
| **Amount** | Charge amount per period | Yes |
| **Token** | SOL or PYUSD | Yes |
| **Recipient** | Payment recipient address | Yes |
| **Charge Type** | One-time or Recurring | Yes |
| **Memo** | Description (optional) | No |

#### Schedule Configuration

**For One-time Charges:**
- **Execute Date**: When to execute the payment
- **Execute Time**: Specific time for execution

**For Recurring Charges:**
- **Start Date**: When recurring charges begin
- **Interval**: Daily, Weekly, Monthly, Yearly
- **Max Executions**: Optional limit on executions

### Step 3: Review and Create

1. **Review Details**: Verify all information
2. **Check Balance**: Ensure sufficient funds
3. **Sign Transaction**: Approve charge creation
4. **Confirmation**: Receive charge ID and details

## Managing Scheduled Charges

### View Active Charges

Access your charge dashboard:

- **Active**: Charges awaiting execution
- **Completed**: Successfully executed charges
- **Cancelled**: Manually cancelled charges
- **Failed**: Charges that couldn't execute

### Charge Details

Each charge displays:

- **Charge ID**: Unique identifier
- **Type**: One-time or Recurring
- **Amount & Schedule**: Payment details
- **Next Execution**: When next payment occurs
- **Execution History**: Past payment records
- **Status**: Current charge status

### Modifying Charges

**Update Amount:**
- Change payment amount for future executions
- Past executions remain unchanged
- Requires transaction approval

**Change Schedule:**
- Modify execution dates (future only)
- Update intervals for recurring charges
- Cancel and recreate for major changes

### Cancelling Charges

Cancel active charges anytime:

1. **Locate Charge**: Find in dashboard
2. **Click Cancel**: Use cancel button
3. **Confirm Cancellation**: Sign transaction
4. **Refund**: Unused funds returned (if applicable)

:::warning Cancellation Timing
Cancel charges before execution time to avoid unwanted payments.
:::

## How Execution Works

### Permissionless Execution

Charges execute automatically through "keepers":

- **Anyone Can Execute**: Permissionless design
- **Incentive Compatible**: Executors can collect fees
- **Reliable Execution**: Multiple parties ensure execution

### Execution Conditions

Charges execute when:

- **Time Reached**: Current time >= scheduled time
- **Sufficient Balance**: Authority has enough tokens
- **Active Status**: Charge hasn't been cancelled
- **Within Limits**: Recurring charges under max executions

### Execution Process

1. **Detection**: Executor finds eligible charges
2. **Validation**: Verifies all conditions met
3. **Execution**: Transfers tokens to recipient
4. **Update**: Records execution in charge account
5. **Fee Collection**: Executor receives small fee

## Advanced Features

### Bulk Charges

Create multiple charges simultaneously:

1. **Upload CSV**: Import charge configurations
2. **Batch Processing**: Create multiple charges
3. **Individual Management**: Manage each charge separately

### Charge Templates

Save recurring charge configurations:

1. **Create Template**: Save charge settings
2. **Apply Template**: Use for similar charges
3. **Template Library**: Manage saved templates

### Conditional Charges

Advanced charges with conditions:

- **Balance Triggers**: Execute when balance reaches threshold
- **Price Triggers**: Execute based on token prices
- **Event Triggers**: Execute on external events

## Security & Permissions

### Authority Control

- **Only Creator Can Cancel**: Charge creator maintains control
- **Secure PDA**: Charges use program-derived addresses
- **Immutable History**: Execution records cannot be altered

### Fund Protection

- **Pre-funded**: Charges require upfront funding
- **Exact Amounts**: Only specified amounts are transferred
- **Authority Approval**: All modifications require approval

### Privacy Considerations

- **Public Parameters**: Charge details visible on-chain
- **Transaction Visibility**: All executions publicly visible
- **Address Exposure**: Recipient addresses are public

## Troubleshooting

### Creation Issues

**"Insufficient funds"**
- Ensure balance covers charge amount + fees
- For recurring: ensure balance for all executions
- Check token balance and type

**"Invalid schedule"**
- Start date must be in future
- Intervals must be positive
- Max executions must be reasonable

**"Invalid recipient"**
- Verify recipient address format
- Ensure address is valid Solana address
- Check for typos

### Execution Problems

**"Charge not executing"**
- Check if execution time has passed
- Verify sufficient balance
- Ensure charge is still active

**"Failed executions"**
- Check transaction history for errors
- Verify network conditions
- Contact support for persistent failures

### Management Issues

**"Cannot cancel charge"**
- Only charge creator can cancel
- Use correct wallet connection
- Check charge status

**"Cannot modify charge"**
- Some parameters cannot be changed
- Create new charge for major changes
- Check modification permissions

## Integration Examples

### Subscription Service

```typescript
// Create monthly subscription charge
const subscriptionCharge = await blinkpay.createScheduledCharge({
  amount: 50,
  token: 'SOL',
  recipient: 'service-provider-wallet',
  chargeType: 'recurring',
  interval: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  maxExecutions: 12, // 1 year
  memo: 'Monthly subscription - Premium Plan'
})
```

### Rent Payment

```typescript
// Set up monthly rent payment
const rentCharge = await blinkpay.createScheduledCharge({
  amount: 1000,
  token: 'PYUSD',
  recipient: 'landlord-wallet',
  chargeType: 'recurring',
  startDate: firstOfNextMonth(),
  interval: 30 * 24 * 60 * 60 * 1000,
  memo: 'Monthly rent - Apartment 5B'
})
```

### API Integration

```typescript
// REST API example
const response = await fetch('/api/scheduled-charges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 25,
    token: 'SOL',
    recipient: 'recipient-address',
    chargeType: 'recurring',
    interval: 604800000, // 1 week in ms
    maxExecutions: 52 // 1 year
  })
})

const charge = await response.json()
```

## Best Practices

### Charge Creation

- **Realistic Amounts**: Set appropriate payment amounts
- **Clear Descriptions**: Use descriptive memos
- **Appropriate Intervals**: Choose suitable payment frequencies

### Fund Management

- **Maintain Balance**: Keep sufficient funds for charges
- **Monitor Usage**: Track charge execution history
- **Plan Ahead**: Fund accounts before charge execution

### Security

- **Verify Recipients**: Double-check payment addresses
- **Regular Reviews**: Audit active charges periodically
- **Secure Wallets**: Use secure wallet practices

## API Reference

### Create Scheduled Charge

```typescript
interface CreateScheduledChargeParams {
  amount: number                    // Amount per charge
  token: 'SOL' | 'PYUSD'           // Token type
  recipient: string                // Recipient address
  chargeType: 'one-time' | 'recurring'
  executeAt?: number               // For one-time charges
  startDate?: number               // For recurring charges
  interval?: number                // Recurring interval (ms)
  maxExecutions?: number           // Max executions
  memo?: string                    // Optional description
}

const charge = await blinkpay.createScheduledCharge(params)
```

### Get Charge Status

```typescript
const status = await blinkpay.getChargeStatus(chargeId)
// Returns: 'active' | 'completed' | 'cancelled' | 'paused'
```

### Cancel Charge

```typescript
await blinkpay.cancelCharge(chargeId)
```

### List User Charges

```typescript
const charges = await blinkpay.getUserCharges(walletAddress)
// Returns array of charge objects
```

---

Need help with development? Check out our [Developer Guide](../developer-guide/overview.md) or [API Reference](../api-reference/overview.md).