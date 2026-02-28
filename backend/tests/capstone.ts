import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Capstone } from "../target/types/capstone";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import fs from "fs";
import crypto from 'crypto'




 describe("capstone", () => {

  const provider = anchor.AnchorProvider.env(); 
  anchor.setProvider(provider);

  async function fundWallet(
    from: Keypair,
    to: PublicKey,
    solAmount: number
  ) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: solAmount * anchor.web3.LAMPORTS_PER_SOL,
      })
    );

    await provider.sendAndConfirm(tx, [from]);
  }

   const program = anchor.workspace.capstone as Program<Capstone>;
   
   function loadWallet(path: string): Keypair {
     const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
     return Keypair.fromSecretKey(Uint8Array.from(secret));
   }

   const admin = loadWallet("./wallets/admin.json");
   const user = loadWallet("./wallets/user.json");
   const contributor1 = loadWallet("./wallets/contributor1.json");
   const contributor2 = loadWallet("./wallets/contributor2.json");
   const contributor3 = loadWallet("./wallets/contributor3.json");
   const contributor4 = loadWallet("./wallets/contributor4.json");
   const contributor5 = loadWallet("./wallets/contributor5.json");

  async function loadMoney() {
    await fundWallet(provider.wallet.payer, admin.publicKey, 10);
    await fundWallet(provider.wallet.payer, user.publicKey, 10);
    await fundWallet(provider.wallet.payer, contributor1.publicKey, 10);
    await fundWallet(provider.wallet.payer, contributor2.publicKey, 10);
    await fundWallet(provider.wallet.payer, contributor3.publicKey, 10);
    await fundWallet(provider.wallet.payer, contributor4.publicKey, 10);
    await fundWallet(provider.wallet.payer, contributor5.publicKey, 10);
  }
   
  const VAULT_SEED = "VAULT";
  const PROJECT_SEED = "PROJECT";
  const CONTRIBUTION_SEED = "CONTRIBUTION";
  const MILESTONE_SEED = "MILESTONE";
  const USER_SEED = "USER";
  const VOTE_SEED = "VOTE";

   it("Initializes the vault", async () => {
     await loadMoney();

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
      .signers([admin])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);

    assert.strictEqual(
      vaultAccount.authority.toString(),
      admin.publicKey.toString()
    );

    assert.strictEqual(vaultAccount.bump, vaultBump);
  });

  it("Initializes a separate user account", async () => {

    await loadMoney(); 

    // derive User PDA
    const [userPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), user.publicKey.toBuffer()],
      program.programId
    );

    const beforeTs = Math.floor(Date.now() / 1000);

    await program.methods
      .initializeUser()
      .accountsStrict({
        user: user.publicKey,
        userAccount: userPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user]) 
      .rpc();

    const userAccount = await program.account.user.fetch(userPda);``

    assert.strictEqual(userAccount.donatedAmount.toNumber(), 0, "donated amount is not correct");
    assert.strictEqual(userAccount.totalVotes.toNumber(), 0, "total votes are not correct");
    assert.strictEqual(userAccount.projectsPosted.toNumber(), 0, "projects posted are not correct");
    assert.strictEqual(userAccount.milestonesPosted.toNumber(), 0, "milestones posted are not correct");
    assert.strictEqual(userAccount.milestonesCleared.toNumber(), 0, "milestones cleared are not correct");
    assert.strictEqual(userAccount.projectsSucceed.toNumber(), 0, "projects succeeded are not correct");

    assert.strictEqual(userAccount.bump, bump, "bump is not correct");

    assert.isAtLeast(userAccount.timeJoined.toNumber(), beforeTs, "joining time is not correct");
    assert.isAtLeast(userAccount.lastActiveTime.toNumber(), beforeTs, "last active time is not correct");
  });

  it("Creates a project successfully", async () => {

  const projectName = "MyProject1";
  const milestoneCount = 3;
  const targetAmount = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL);
  const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

  const [projectPda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(PROJECT_SEED),
      Buffer.from(projectName),
      user.publicKey.toBuffer(),
    ],
    program.programId
  );

  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_SEED), user.publicKey.toBuffer()],
    program.programId
  );

  const beforeUser = await program.account.user.fetch(userPda);

  await program.methods
    .createProject(projectName, milestoneCount, targetAmount, deadline)
    .accountsStrict({
      projectAuthority: user.publicKey,
      project: projectPda,
      user: userPda,
      systemProgram: SystemProgram.programId,
    })
    .signers([user])
    .rpc();

  const projectAccount = await program.account.project.fetch(projectPda);
  const afterUser = await program.account.user.fetch(userPda);

  assert.strictEqual(projectAccount.projectAuthority.toString(), user.publicKey.toString());
  assert.strictEqual(projectAccount.projectName, projectName);
  assert.strictEqual(projectAccount.targetAmount.toString(), targetAmount.toString());
  assert.strictEqual(projectAccount.collectedAmount.toNumber(), 0);
  assert.strictEqual(projectAccount.withdrawnAmount.toNumber(), 0);
  assert.strictEqual(projectAccount.milestoneCount, milestoneCount);
  assert.strictEqual(projectAccount.milestonesCompleted, 0);
  assert.strictEqual(projectAccount.funderCount, 0);

  // User updated
  assert.strictEqual(
    afterUser.projectsPosted.toNumber(),
    beforeUser.projectsPosted.toNumber() + 1
  );
});

});