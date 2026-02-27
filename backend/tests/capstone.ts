import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Capstone } from "../target/types/capstone";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import crypto from 'crypto'


describe("capstone", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.capstone as Program<Capstone>;
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider)

  const admin = provider.wallet;

  const VAULT_SEED = "VAULT_SEED";

  it("Initializes the vault", async () => {

    // derive Vault PDA
    const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED)],
      program.programId
    );

    await program.methods
      .initialize()
      .accountsStrict({
        admin: admin.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);

    assert.strictEqual(
      vaultAccount.authority.toString(),
      admin.publicKey.toString()
    );

    assert.strictEqual(vaultAccount.bump, vaultBump);
  });
});
