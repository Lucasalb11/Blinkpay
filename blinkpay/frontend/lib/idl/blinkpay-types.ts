/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blinkpay.json`.
 */
export type Blinkpay = {
  "address": "J888wm5zYDcxXLyGxYkHBwiWJpQ1J7ZKMKBoGJKCjjM",
  "metadata": {
    "name": "blinkpay",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelScheduledCharge",
      "docs": [
        "Cancel a scheduled charge",
        "Only the authority can cancel their own charges"
      ],
      "discriminator": [
        29,
        1,
        39,
        240,
        32,
        20,
        58,
        111
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The authority cancelling the charge (must be the creator)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "scheduledCharge",
          "docs": [
            "The scheduled charge account"
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "createPaymentRequest",
      "docs": [
        "Create a new payment request",
        "Allows users to request payments that can be fulfilled by anyone"
      ],
      "discriminator": [
        246,
        150,
        103,
        37,
        15,
        36,
        93,
        100
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The authority creating the payment request (payer)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "paymentRequest",
          "docs": [
            "The payment request account to be created"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "recipient"
              },
              {
                "kind": "arg",
                "path": "amount"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for account creation"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "docs": [
            "Clock sysvar for timestamp"
          ],
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "memo",
          "type": "string"
        },
        {
          "name": "nonce",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createScheduledCharge",
      "docs": [
        "Create a new scheduled charge",
        "Sets up automatic payments that execute at specified times"
      ],
      "discriminator": [
        167,
        152,
        161,
        195,
        121,
        23,
        143,
        236
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The authority creating the scheduled charge"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "scheduledCharge",
          "docs": [
            "The scheduled charge account to be created"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program for account creation"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "docs": [
            "Clock sysvar for timestamp validation"
          ],
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "executeAt",
          "type": "i64"
        },
        {
          "name": "chargeType",
          "type": "u8"
        },
        {
          "name": "intervalSeconds",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "maxExecutions",
          "type": {
            "option": "u32"
          }
        },
        {
          "name": "memo",
          "type": "string"
        },
        {
          "name": "clientTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "executeScheduledCharge",
      "docs": [
        "Execute a scheduled charge",
        "Can be called by anyone when the execution time has been reached"
      ],
      "discriminator": [
        187,
        158,
        49,
        161,
        46,
        131,
        1,
        107
      ],
      "accounts": [
        {
          "name": "executor",
          "docs": [
            "The executor (can be anyone)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "scheduledCharge",
          "docs": [
            "The scheduled charge account"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority's SOL account (for SOL payments)"
          ],
          "writable": true,
          "signer": true,
          "optional": true
        },
        {
          "name": "recipient",
          "docs": [
            "Recipient's SOL account (for SOL payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "authorityTokenAccount",
          "docs": [
            "Authority's token account (for SPL token payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "recipientTokenAccount",
          "docs": [
            "Recipient's token account (for SPL token payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program (for SPL token payments)"
          ],
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Associated token program (for SPL token payments)"
          ],
          "optional": true,
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program (for SOL payments)"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "docs": [
            "Clock sysvar for time validation"
          ],
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "payRequest",
      "docs": [
        "Pay a payment request",
        "Anyone can pay a pending payment request to fulfill it"
      ],
      "discriminator": [
        182,
        174,
        240,
        192,
        60,
        83,
        75,
        174
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "The payer fulfilling the payment request"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "paymentRequest",
          "docs": [
            "The payment request account"
          ],
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "Recipient's SOL account (for SOL payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "payerTokenAccount",
          "docs": [
            "Payer's token account (for SPL token payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "recipientTokenAccount",
          "docs": [
            "Recipient's token account (for SPL token payments)"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program (for SPL token payments)"
          ],
          "optional": true,
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Associated token program (for SPL token payments)"
          ],
          "optional": true,
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program (for SOL payments)"
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "paymentRequest",
      "discriminator": [
        27,
        20,
        202,
        96,
        101,
        242,
        124,
        69
      ]
    },
    {
      "name": "scheduledCharge",
      "discriminator": [
        27,
        78,
        102,
        7,
        117,
        77,
        156,
        15
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "paymentRequestNotPending",
      "msg": "Payment request is not pending"
    },
    {
      "code": 6001,
      "name": "paymentRequestAlreadyPaid",
      "msg": "Payment request has already been paid"
    },
    {
      "code": 6002,
      "name": "paymentRequestCancelled",
      "msg": "Payment request has been cancelled"
    },
    {
      "code": 6003,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for payment"
    },
    {
      "code": 6004,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint provided"
    },
    {
      "code": 6005,
      "name": "scheduledChargeNotPending",
      "msg": "Scheduled charge is not pending"
    },
    {
      "code": 6006,
      "name": "scheduledChargeAlreadyExecuted",
      "msg": "Scheduled charge has already been executed"
    },
    {
      "code": 6007,
      "name": "scheduledChargeCancelled",
      "msg": "Scheduled charge has been cancelled"
    },
    {
      "code": 6008,
      "name": "executionTimeNotReached",
      "msg": "Scheduled charge execution time has not been reached"
    },
    {
      "code": 6009,
      "name": "maxExecutionsExceeded",
      "msg": "Scheduled charge has exceeded maximum executions"
    },
    {
      "code": 6010,
      "name": "invalidAuthority",
      "msg": "Invalid authority for this operation"
    },
    {
      "code": 6011,
      "name": "invalidRecipient",
      "msg": "Invalid recipient address"
    },
    {
      "code": 6012,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6013,
      "name": "invalidTimestamp",
      "msg": "Invalid timestamp provided"
    },
    {
      "code": 6014,
      "name": "invalidInterval",
      "msg": "Invalid interval for recurring charge"
    },
    {
      "code": 6015,
      "name": "overflow",
      "msg": "Arithmetic overflow occurred"
    },
    {
      "code": 6016,
      "name": "memoTooLong",
      "msg": "Memo too long (max 200 characters)"
    },
    {
      "code": 6017,
      "name": "invalidTokenAccountOwner",
      "msg": "Token account not owned by expected owner"
    },
    {
      "code": 6018,
      "name": "invalidAssociatedTokenAccount",
      "msg": "Associated token account mismatch"
    }
  ],
  "types": [
    {
      "name": "paymentRequest",
      "docs": [
        "Payment request account",
        "Stores information about a payment request that can be paid by anyone"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The creator/owner of the payment request"
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "The recipient who should receive the payment"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount to be paid (in smallest units)"
            ],
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Token mint (Pubkey::default() for SOL)"
            ],
            "type": "pubkey"
          },
          {
            "name": "memo",
            "docs": [
              "Optional memo/description"
            ],
            "type": "string"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when request was created"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Status of the payment request"
            ],
            "type": {
              "defined": {
                "name": "paymentRequestStatus"
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentRequestStatus",
      "docs": [
        "Status of a payment request"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "paid"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "scheduledCharge",
      "docs": [
        "Scheduled charge account",
        "Stores information about payments that execute automatically based on time conditions"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The creator/owner of the scheduled charge"
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "The recipient who should receive the payment"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount to be paid per execution (in smallest units)"
            ],
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Token mint (Pubkey::default() for SOL)"
            ],
            "type": "pubkey"
          },
          {
            "name": "chargeType",
            "docs": [
              "Type of scheduled charge"
            ],
            "type": {
              "defined": {
                "name": "scheduledChargeType"
              }
            }
          },
          {
            "name": "executeAt",
            "docs": [
              "Timestamp when the charge should first execute"
            ],
            "type": "i64"
          },
          {
            "name": "intervalSeconds",
            "docs": [
              "For recurring charges: interval between executions (in seconds)"
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "lastExecutedAt",
            "docs": [
              "Timestamp of last execution (None if never executed)"
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "maxExecutions",
            "docs": [
              "Maximum number of executions (None for unlimited recurring)"
            ],
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "executionCount",
            "docs": [
              "Current execution count"
            ],
            "type": "u32"
          },
          {
            "name": "memo",
            "docs": [
              "Optional memo/description"
            ],
            "type": "string"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when charge was created"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Status of the scheduled charge"
            ],
            "type": {
              "defined": {
                "name": "scheduledChargeStatus"
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "scheduledChargeStatus",
      "docs": [
        "Status of a scheduled charge"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "executed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "scheduledChargeType",
      "docs": [
        "Type of scheduled charge"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "oneTime"
          },
          {
            "name": "recurring"
          }
        ]
      }
    }
  ]
};
