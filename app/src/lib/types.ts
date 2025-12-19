export type Blinkpay = {
  "version": "0.1.0",
  "name": "blinkpay",
  "instructions": [
    {
      "name": "createPaymentRequest",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "paymentRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "tokenMint",
          "type": "publicKey"
        },
        {
          "name": "recipient",
          "type": "publicKey"
        },
        {
          "name": "memo",
          "type": "string"
        },
        {
          "name": "currentTime",
          "type": "i64"
        }
      ]
    }
  ]
}