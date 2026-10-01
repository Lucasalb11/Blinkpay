# Blinkpay

**Payment links on Solana.** Create a request for an amount in SOL or USDC, share the link,
and whoever opens it pays from their own wallet. The program sends the funds straight to you
and marks the request paid on-chain, so it can't be paid twice.

- **Live app:** _deploying to Vercel_ (devnet)
- **Program (devnet):** [`J888wm5zYDcxXLyGxYkHBwiWJpQ1J7ZKMKBoGJKCjjM`](https://explorer.solana.com/address/J888wm5zYDcxXLyGxYkHBwiWJpQ1J7ZKMKBoGJKCjjM?cluster=devnet)
- **Write-up with threat model:** [lucasalmeida.me/work/blinkpay](https://lucasalmeida.me/work/blinkpay)

## Repository

```
blinkpay/system/     Anchor program + tests (Anchor 0.32)
blinkpay/frontend/   Next.js app: create links, pay page, dashboard read from chain
```

## Program

| Instruction | Who | What |
| --- | --- | --- |
| `create_payment_request` | merchant | Stores amount, mint (default pubkey = SOL) and recipient in a PDA |
| `pay_request` | anyone | Transfers SOL or SPL tokens to the stored recipient, marks the request paid |
| `create_scheduled_charge` | payer | One-off or recurring SOL charge to a fixed recipient |
| `execute_scheduled_charge` | payer | Runs a due charge (Clock-checked, `max_executions` enforced) |
| `cancel_scheduled_charge` | payer | Closes the charge and returns rent |

### Security fixes in this version

- **SPL payments could be redirected.** `pay_request` didn't check the recipient token account,
  so a payer could mark a request paid while sending tokens to an account they controlled, or
  pay in a different token. Both token accounts are now checked for owner and mint
  (`tests/spl-payments.ts`).
- **Time came from the client.** `create_*` took `current_time` as an argument and used it for
  `created_at` and to validate that `execute_at` was in the future. Time now comes from the
  Clock sysvar; the argument survives only as a nonce for the PDA seed.
- **SPL scheduled charges would panic.** They need a delegate-approval flow that doesn't exist
  yet, so creation now rejects non-SOL mints with `InvalidTokenMint` instead of failing at
  execution.

## Develop

```bash
cd blinkpay/system
yarn install
anchor build
anchor test            # 9 tests, local validator

cd ../frontend
yarn install
yarn dev               # http://localhost:3000, talks to devnet
```

`NEXT_PUBLIC_RPC_ENDPOINT` overrides the default devnet RPC.
