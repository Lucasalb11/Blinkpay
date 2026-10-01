import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";
import { Blinkpay } from "../target/types/blinkpay";

describe("blinkpay SPL payment requests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.blinkpay as Program<Blinkpay>;
  const connection = provider.connection;

  const merchant = Keypair.generate();
  const customer = Keypair.generate();
  const amount = 5_000_000; // 5 tokens at 6 decimals

  let mint: PublicKey;
  let customerAta: PublicKey;
  let merchantAta: PublicKey;
  let customerSecondAta: PublicKey;

  const airdrop = async (to: PublicKey) =>
    connection.confirmTransaction(await connection.requestAirdrop(to, 2 * LAMPORTS_PER_SOL));

  before(async () => {
    await airdrop(merchant.publicKey);
    await airdrop(customer.publicKey);
    mint = await createMint(connection, customer, customer.publicKey, null, 6);
    customerAta = (await getOrCreateAssociatedTokenAccount(connection, customer, mint, customer.publicKey)).address;
    merchantAta = (await getOrCreateAssociatedTokenAccount(connection, customer, mint, merchant.publicKey)).address;
    // A second account the customer controls, to try and redirect the payment to themselves.
    const decoy = Keypair.generate();
    customerSecondAta = (
      await getOrCreateAssociatedTokenAccount(connection, customer, mint, decoy.publicKey)
    ).address;
    await mintTo(connection, customer, mint, customerAta, customer, 20_000_000);
  });

  const requestFrom = async (authority: Keypair, nonce: number) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment_request"),
        authority.publicKey.toBuffer(),
        merchant.publicKey.toBuffer(),
        new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
        new anchor.BN(nonce).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    await program.methods
      .createPaymentRequest(new anchor.BN(amount), mint, merchant.publicKey, "invoice", new anchor.BN(nonce))
      .accounts({ authority: authority.publicKey, paymentRequest: pda })
      .signers([authority])
      .rpc();
    return pda;
  };

  it("rejects paying an SPL request into an account the recipient doesn't own", async () => {
    const pda = await requestFrom(customer, 1);
    try {
      await program.methods
        .payRequest()
        .accounts({
          payer: customer.publicKey,
          paymentRequest: pda,
          recipient: null,
          payerTokenAccount: customerAta,
          recipientTokenAccount: customerSecondAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([customer])
        .rpc();
      expect.fail("payment into a non-recipient account should be rejected");
    } catch (err) {
      expect(String(err)).to.include("InvalidTokenAccountOwner");
    }
    const request = await program.account.paymentRequest.fetch(pda);
    expect(request.status).to.deep.equal({ pending: {} });
  });

  it("pays an SPL request the merchant created for themselves", async () => {
    const pda = await requestFrom(merchant, 2);
    await program.methods
      .payRequest()
      .accounts({
        payer: customer.publicKey,
        paymentRequest: pda,
        recipient: null,
        payerTokenAccount: customerAta,
        recipientTokenAccount: merchantAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([customer])
      .rpc();
    expect(Number((await getAccount(connection, merchantAta)).amount)).to.equal(amount);
    const request = await program.account.paymentRequest.fetch(pda);
    expect(request.status).to.deep.equal({ paid: {} });
  });
});
