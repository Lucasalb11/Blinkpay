import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Blinkpay } from "../target/types/blinkpay";
import { expect } from "chai";

const getCurrentTime = () => Math.floor(Date.now() / 1000);

describe("blinkpay", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.blinkpay as Program<Blinkpay>;
  const provider = anchor.AnchorProvider.env();

  // Test accounts
  let payer: anchor.web3.Keypair;
  let recipient: anchor.web3.Keypair;
  let thirdParty: anchor.web3.Keypair;

  // Test data
  const amount = 1_000_000; // 0.001 SOL
  const memo = "Test payment";
  const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  before(async () => {
    // Create test accounts
    payer = anchor.web3.Keypair.generate();
    recipient = anchor.web3.Keypair.generate();
    thirdParty = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(recipient.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(thirdParty.publicKey, 2 * LAMPORTS_PER_SOL)
    );
  });

  describe("Payment Requests", () => {
    let paymentRequestPda: PublicKey;
    let paymentRequestBump: number;
    let testTimestamp: number;

    beforeEach(async () => {
      // Use a unique timestamp for each test
      testTimestamp = getCurrentTime() + Math.floor(Math.random() * 1000);
      [paymentRequestPda, paymentRequestBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("payment_request"),
          payer.publicKey.toBuffer(),
          recipient.publicKey.toBuffer(),
          new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
          new anchor.BN(testTimestamp).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
    });

    it("Creates a payment request", async () => {
      const tx = await program.methods
        .createPaymentRequest(
          new anchor.BN(amount),
          SystemProgram.programId, // SOL token mint
          recipient.publicKey,
          memo,
          new anchor.BN(testTimestamp)
        )
        .accounts({
          authority: payer.publicKey,
          paymentRequest: paymentRequestPda,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([payer])
        .rpc();

      // Fetch the created payment request
      const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);

      expect(paymentRequest.authority.toString()).to.equal(payer.publicKey.toString());
      expect(paymentRequest.recipient.toString()).to.equal(recipient.publicKey.toString());
      expect(paymentRequest.amount.toNumber()).to.equal(amount);
      expect(paymentRequest.tokenMint.toString()).to.equal(SystemProgram.programId.toString());
      expect(paymentRequest.memo).to.equal(memo);
      expect(paymentRequest.status).to.deep.equal({ pending: {} });
      expect(paymentRequest.bump).to.equal(paymentRequestBump);
    });

    it("Pays a payment request with SOL", async () => {
      // Create payment request first
      await program.methods
        .createPaymentRequest(
          new anchor.BN(amount),
          SystemProgram.programId,
          recipient.publicKey,
          memo,
          new anchor.BN(testTimestamp)
        )
        .accounts({
          authority: payer.publicKey,
          paymentRequest: paymentRequestPda,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([payer])
        .rpc();

      const payerBalanceBefore = await provider.connection.getBalance(payer.publicKey);
      const recipientBalanceBefore = await provider.connection.getBalance(recipient.publicKey);

      // Pay the request
      await program.methods
        .payRequest()
        .accounts({
          payer: thirdParty.publicKey,
          paymentRequest: paymentRequestPda,
          recipient: recipient.publicKey,
          payerTokenAccount: null,
          recipientTokenAccount: null,
          tokenProgram: null,
          associatedTokenProgram: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([thirdParty])
        .rpc();

      const payerBalanceAfter = await provider.connection.getBalance(payer.publicKey);
      const recipientBalanceAfter = await provider.connection.getBalance(recipient.publicKey);

      // Check balances
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(amount);

      // Check payment request status
      const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
      expect(paymentRequest.status).to.deep.equal({ paid: {} });
    });

    it("Fails to pay already paid request", async () => {
      try {
        await program.methods
          .payRequest()
          .accounts({
            payer: thirdParty.publicKey,
            paymentRequest: paymentRequestPda,
            recipient: recipient.publicKey,
            payerTokenAccount: null,
            recipientTokenAccount: null,
            tokenProgram: null,
            associatedTokenProgram: null,
            systemProgram: SystemProgram.programId,
          })
          .signers([thirdParty])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        // Should fail due to account constraint - request is already paid
        expect(error.message).to.include("payment_request");
      }
    });
  });

  describe("Scheduled Charges", () => {
    let testTimestamp: number;

    beforeEach(async () => {
      // Use a unique timestamp for each test
      testTimestamp = getCurrentTime() + Math.floor(Math.random() * 1000);
    });

    const authority = provider.wallet.publicKey;

    it("Creates a one-time scheduled charge", async () => {
      const executeAt = testTimestamp + futureTimestamp;
      const [scheduledChargePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("scheduled_charge"),
          authority.toBuffer(),
          recipient.publicKey.toBuffer(),
          new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
          new anchor.BN(executeAt).toArrayLike(Buffer, "le", 8),
          new Uint8Array([0]), // ScheduledChargeType::OneTime = 0
        ],
        program.programId
      );

      const tx = await program.methods
        .createScheduledCharge(
          new anchor.BN(amount),
          SystemProgram.programId,
          recipient.publicKey,
          new anchor.BN(executeAt),
          0, // ScheduledChargeType::OneTime = 0
          null, // no interval
          null, // no max executions
          memo,
          new anchor.BN(testTimestamp)
        )
        .accounts({
          authority: authority,
          scheduledCharge: scheduledChargePda,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      const scheduledCharge = await program.account.scheduledCharge.fetch(scheduledChargePda);

      expect(scheduledCharge.authority.toString()).to.equal(authority.toString());
      expect(scheduledCharge.recipient.toString()).to.equal(recipient.publicKey.toString());
      expect(scheduledCharge.amount.toNumber()).to.equal(amount);
      expect(scheduledCharge.chargeType).to.deep.equal({ oneTime: {} });
      expect(scheduledCharge.executeAt.toNumber()).to.equal(executeAt);
      expect(scheduledCharge.status).to.deep.equal({ pending: {} });
    });

    it("Executes a scheduled charge", async () => {
      const executeAt = testTimestamp - 10; // 10 seconds in the past
      const [scheduledChargePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("scheduled_charge"),
          authority.toBuffer(),
          recipient.publicKey.toBuffer(),
          new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
          new anchor.BN(executeAt).toArrayLike(Buffer, "le", 8),
          new Uint8Array([0]), // ScheduledChargeType::OneTime = 0
        ],
        program.programId
      );

      // Create the charge first
      await program.methods
        .createScheduledCharge(
          new anchor.BN(amount),
          SystemProgram.programId,
          recipient.publicKey,
          new anchor.BN(executeAt),
          0, // ScheduledChargeType::OneTime = 0
          null,
          null,
          memo,
          new anchor.BN(testTimestamp)
        )
        .accounts({
          authority: authority,
          scheduledCharge: scheduledChargePda,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      // Manually set the clock to future time for testing
      const currentSlot = await provider.connection.getSlot();
      const futureSlot = currentSlot + 100;

      // Execute the charge
      const recipientBalanceBefore = await provider.connection.getBalance(recipient.publicKey);

      await program.methods
        .executeScheduledCharge()
        .accounts({
          executor: thirdParty.publicKey,
          scheduledCharge: scheduledChargePda,
          authority: authority,
          recipient: recipient.publicKey,
          authorityTokenAccount: null,
          recipientTokenAccount: null,
          tokenProgram: null,
          associatedTokenProgram: null,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .signers([thirdParty])
        .rpc();

      const recipientBalanceAfter = await provider.connection.getBalance(recipient.publicKey);

      // Check that payment was made
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(amount);

      // Check charge status
      const scheduledCharge = await program.account.scheduledCharge.fetch(scheduledChargePda);
      expect(scheduledCharge.status).to.deep.equal({ executed: {} });
      expect(scheduledCharge.executionCount).to.equal(1);
    });

    it("Cancels a scheduled charge", async () => {
      // Create a new charge for cancellation
      const cancelTimestamp = futureTimestamp + 7200; // 2 hours from now
      const executeAt = testTimestamp + cancelTimestamp + 200;
      const [cancelPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("scheduled_charge"),
          authority.toBuffer(),
          recipient.publicKey.toBuffer(),
          new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
          new anchor.BN(executeAt).toArrayLike(Buffer, "le", 8),
          new Uint8Array([0]), // ScheduledChargeType::OneTime = 0
        ],
        program.programId
      );

      await program.methods
        .createScheduledCharge(
          new anchor.BN(amount),
          SystemProgram.programId,
          recipient.publicKey,
          new anchor.BN(executeAt),
          0, // ScheduledChargeType::OneTime = 0
          null,
          null,
          memo,
          new anchor.BN(testTimestamp + 100) // Different timestamp for cancel test
        )
        .accounts({
          authority: authority,
          scheduledCharge: cancelPda,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      const authorityBalanceBefore = await provider.connection.getBalance(authority);

      // Cancel the charge
      await program.methods
        .cancelScheduledCharge()
        .accounts({
          authority: authority,
          scheduledCharge: cancelPda,
        })
        .rpc();

      const authorityBalanceAfter = await provider.connection.getBalance(authority);

      // Account should be closed and rent returned
      expect(authorityBalanceAfter).to.be.greaterThan(authorityBalanceBefore);

      // Verify account is closed
      try {
        await program.account.scheduledCharge.fetch(cancelPda);
        expect.fail("Account should be closed");
      } catch (error) {
        // Expected - account doesn't exist
      }
    });
  });
});
