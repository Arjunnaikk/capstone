import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Capstone } from "../target/types/capstone";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import fs from "fs";
import { init, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";

describe("capstone", () => {
  const provider = anchor.AnchorProvider.local("https://devnet.helius-rpc.com/?api-key=c5d32b63-b2f3-46b9-9535-0d5510769438");
  anchor.setProvider(provider);

  const program = anchor.workspace.capstone as Program<Capstone>;

  // Wallet setup
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

  async function fundWallet(from: Keypair, to: PublicKey, solAmount: number) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: solAmount * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(tx, [from]);
  }

  async function loadMoney() {
    await fundWallet(admin, user.publicKey, 10);
    await fundWallet(admin, contributor1.publicKey, 10);
    await fundWallet(admin, contributor2.publicKey, 10);
    await fundWallet(admin, contributor3.publicKey, 10);
    await fundWallet(admin, contributor4.publicKey, 10);
    await fundWallet(admin, contributor5.publicKey, 10);
  }

  const VAULT_SEED = "VAULT";
  const PROJECT_SEED = "PROJECT";
  const CONTRIBUTION_SEED = "CONTRIBUTION";
  const MILESTONE_SEED = "MILESTONE";
  const USER_SEED = "USER";

  let vaultPda: PublicKey;
  let vaultBump: number;
  let userPda: PublicKey;
  let userBump: number;
  let contributor1Pda: PublicKey;
  let contributor2Pda: PublicKey;
  let contributor3Pda: PublicKey;
  let contributor4Pda: PublicKey;
  let contributor5Pda: PublicKey;
  let contribution1Pda: PublicKey;
  let contribution2Pda: PublicKey;
  let contribution3Pda: PublicKey;
  let contribution4Pda: PublicKey;
  let contribution5Pda: PublicKey;
  let project1Pda: PublicKey;
  let project2Pda: PublicKey;
  let project1Bump: number;
  let project2Bump: number;

  const projectName1 = "MyTestProject1";
  const projectName2 = "MyTestProject1";

  // tuktuk setup
  const taskQueue = new anchor.web3.PublicKey(
    "GnCH4xcCtPTqiHa3z76dPW4DX7toa6qCntNJVtwS5KZc"
  );

  const queueAuthority = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("queue_authority")],
    program.programId
  )[0];

  const taskQueueAuthority = taskQueueAuthorityKey(
    taskQueue,
    queueAuthority
  )[0];

  console.log("queueAuthority: ", queueAuthority);

  before(async () => {
    // await loadMoney();

    // derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED)],
      program.programId
    );

    // derive main user PDA
    [userPda, userBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), user.publicKey.toBuffer()],
      program.programId
    );

    // derive contributor PDAs
    [contributor1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), contributor1.publicKey.toBuffer()],
      program.programId
    );

    [contributor2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), contributor2.publicKey.toBuffer()],
      program.programId
    );

    [contributor3Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), contributor3.publicKey.toBuffer()],
      program.programId
    );

    [contributor4Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), contributor4.publicKey.toBuffer()],
      program.programId
    );

    [contributor5Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(USER_SEED), contributor5.publicKey.toBuffer()],
      program.programId
    );

    // derive Project PDAs
    [project1Pda, project1Bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(PROJECT_SEED),
        Buffer.from(projectName1),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    [project2Pda, project2Bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(PROJECT_SEED),
        Buffer.from(projectName2),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // derive contribution PDAs
    [contribution1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor1.publicKey.toBuffer(), project1Pda.toBuffer()],
      program.programId
    );

    [contribution2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor2.publicKey.toBuffer(), project1Pda.toBuffer()],
      program.programId
    );

    [contribution3Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor3.publicKey.toBuffer(), project1Pda.toBuffer()],
      program.programId
    );

    [contribution4Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor4.publicKey.toBuffer(), project1Pda.toBuffer()],
      program.programId
    );

    [contribution5Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor5.publicKey.toBuffer(), project1Pda.toBuffer()],
      program.programId
    );

   
  });

  it("Initializes the vault", async () => {
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

    assert.strictEqual(vaultAccount.authority.toString(), admin.publicKey.toString());
    assert.strictEqual(vaultAccount.bump, vaultBump);
  });

  it("Initializes a user account", async () => {
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

    const userAccount = await program.account.user.fetch(userPda);

    assert.strictEqual(userAccount.donatedAmount.toNumber(), 0, "donated amount is not correct");
    assert.strictEqual(userAccount.projectsPosted.toNumber(), 0, "projects posted are not correct");
    assert.strictEqual(userAccount.bump, userBump, "bump is not correct");
    assert.isAtLeast(userAccount.timeJoined.toNumber(), beforeTs, "joining time is not correct");
  });

  it("Initializes the contributor's user accounts", async () => {
    await program.methods
      .initializeUser()
      .accountsStrict({
        user: contributor1.publicKey,
        userAccount: contributor1Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    await program.methods
      .initializeUser()
      .accountsStrict({
        user: contributor2.publicKey,
        userAccount: contributor2Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    await program.methods
      .initializeUser()
      .accountsStrict({
        user: contributor3.publicKey,
        userAccount: contributor3Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    await program.methods
      .initializeUser()
      .accountsStrict({
        user: contributor4.publicKey,
        userAccount: contributor4Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    await program.methods
      .initializeUser()
      .accountsStrict({
        user: contributor5.publicKey,
        userAccount: contributor5Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();
  });

  it("Creates a project successfully", async () => {
    const milestoneCount = 3;
    const targetAmount = new anchor.BN(0.003 * anchor.web3.LAMPORTS_PER_SOL);
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

    const beforeUser = await program.account.user.fetch(userPda);

    await program.methods
      .createProject({
        projectName: projectName1,
        milestoneCount: milestoneCount,
        targetAmount: targetAmount,
        deadline: deadline
      })
      .accountsStrict({
        projectAuthority: user.publicKey,
        project: project1Pda,
        user: userPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const projectAccount = await program.account.project.fetch(project1Pda);
    const afterUser = await program.account.user.fetch(userPda);

    assert.strictEqual(projectAccount.projectAuthority.toString(), user.publicKey.toString());
    assert.strictEqual(projectAccount.projectName, projectName1);
    assert.strictEqual(projectAccount.targetAmount.toString(), targetAmount.toString());
    assert.strictEqual(projectAccount.collectedAmount.toNumber(), 0);
    assert.strictEqual(projectAccount.bump, project1Bump);
    assert.strictEqual(afterUser.projectsPosted.toNumber(), beforeUser.projectsPosted.toNumber() + 1);
  });

  it("Allows a user to contribute for the first time", async () => {
    const amount = new anchor.BN(0.001 * anchor.web3.LAMPORTS_PER_SOL);

    const beforeProject = await program.account.project.fetch(project1Pda);
    const beforeUser = await program.account.user.fetch(contributor1Pda);
    const beforeVaultBalance = await provider.connection.getBalance(vaultPda);

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor1.publicKey,
        vault: vaultPda,
        project: project1Pda,
        user: contributor1Pda,
        contribution: contribution1Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    const contributionAccount = await program.account.contribution.fetch(contribution1Pda);
    const afterProject = await program.account.project.fetch(project1Pda);
    const afterUser = await program.account.user.fetch(contributor1Pda);
    const afterVaultBalance = await provider.connection.getBalance(vaultPda);

    assert.strictEqual(contributionAccount.amount.toString(), amount.toString());
    assert.strictEqual(afterProject.collectedAmount.toString(), beforeProject.collectedAmount.add(amount).toString());
    assert.strictEqual(afterProject.funderCount, beforeProject.funderCount + 1);
    assert.strictEqual(afterUser.donatedAmount.toString(), beforeUser.donatedAmount.add(amount).toString());
    assert.strictEqual(afterVaultBalance, beforeVaultBalance + amount.toNumber());
  });

  it("Aggregates contribution if same user contributes again", async () => {

    const amount = new anchor.BN(
      0.001 * anchor.web3.LAMPORTS_PER_SOL
    );

    const beforeProject =
      await program.account.project.fetch(project1Pda);

    const beforeContribution =
      await program.account.contribution.fetch(contribution1Pda);

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor1.publicKey,
        vault: vaultPda,
        project: project1Pda,
        user: contributor1Pda,
        contribution: contribution1Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    const afterProject =
      await program.account.project.fetch(project1Pda);

    const afterContribution =
      await program.account.contribution.fetch(contribution1Pda);

    assert.strictEqual(
      afterContribution.amount.toString(),
      beforeContribution.amount.add(amount).toString()
    );

    assert.strictEqual(
      afterProject.funderCount,
      beforeProject.funderCount
    );
  });

  it("Moves project to Development once target is reached", async () => {
    const amount = new anchor.BN(0.001 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor2.publicKey,
        vault: vaultPda,
        project: project1Pda,
        user: contributor2Pda,
        contribution: contribution2Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    const updatedProject =
      await program.account.project.fetch(project1Pda);

    assert.ok(
      updatedProject.projectState.development !== undefined
    );
  });

  it("Creates a milestone successfully", async () => {

    const milestoneType = { design: {} };
    const milestoneClaim = 1; 
    let tuktukProgram = await init(provider);
    const taskId = 37;

    const [milestonePda, milestoneBump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(MILESTONE_SEED),
          user.publicKey.toBuffer(),
          project1Pda.toBuffer(),
          Buffer.from([0]) 
        ],
        program.programId
      );

    const beforeUser = await program.account.user.fetch(userPda);

    await program.methods
      .createMilestone(
        {
          milestoneType,
          milestoneClaim
        },
        taskId
      )
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        milestone: milestonePda,
        vault: vaultPda,
        project: project1Pda,
        user: userPda,
        taskQueue: taskQueue,
        taskQueueAuthority: taskQueueAuthority,
        task: taskKey(taskQueue, taskId)[0],
        queueAuthority: queueAuthority,
        systemProgram: SystemProgram.programId,
        tuktukProgram: tuktukProgram.programId,
      })
      .signers([user])
      .rpc({
        skipPreflight: true
      });

    const milestoneAccount =
      await program.account.milestone.fetch(milestonePda);

    const afterUser =
      await program.account.user.fetch(userPda);

    assert.strictEqual(
      milestoneAccount.projectId.toString(),
      project1Pda.toString()
    );

    assert.strictEqual(
      milestoneAccount.milestoneClaim,
      milestoneClaim
    );

    assert.strictEqual(
      milestoneAccount.attemptNumber,
      0
    );

    assert.ok(
      milestoneAccount.milestoneStatus.voting !== undefined
    );

    assert.strictEqual(
      milestoneAccount.voteForWeight.toNumber(),
      0
    );

    assert.strictEqual(
      milestoneAccount.voteAgainstWeight.toNumber(),
      0
    );

    assert.strictEqual(
      milestoneAccount.bump,
      milestoneBump
    );

    assert.strictEqual(
      afterUser.milestonesPosted.toNumber(),
      beforeUser.milestonesPosted.toNumber() + 1
    );
  });
});