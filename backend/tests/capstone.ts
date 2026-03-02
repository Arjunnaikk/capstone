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

  function getRandomId(): number {
    return Math.floor(Math.random() * 1000) + 1;
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

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const VAULT_SEED = "VAULT";
  const PROJECT_SEED = "PROJECT";
  const CONTRIBUTION_SEED = "CONTRIBUTION";
  const MILESTONE_SEED = "MILESTONE";
  const USER_SEED = "USER";
  const VOTE_SEED = "VOTE";

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
  let contribution12Pda: PublicKey;
  let contribution22Pda: PublicKey;
  let contribution32Pda: PublicKey;
  let contribution42Pda: PublicKey;
  let contribution52Pda: PublicKey;
  let project1Pda: PublicKey;
  let project2Pda: PublicKey;
  let project1Bump: number;
  let project2Bump: number;

  const projectName1 = "MyTestProject1";
  const projectName2 = "MyTestProject2";

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

    [contribution12Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor1.publicKey.toBuffer(), project2Pda.toBuffer()],
      program.programId
    );

    [contribution22Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor2.publicKey.toBuffer(), project2Pda.toBuffer()],
      program.programId
    );

    [contribution32Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor3.publicKey.toBuffer(), project2Pda.toBuffer()],
      program.programId
    );

    [contribution42Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor4.publicKey.toBuffer(), project2Pda.toBuffer()],
      program.programId
    );

    [contribution52Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), contributor5.publicKey.toBuffer(), project2Pda.toBuffer()],
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

    assert.strictEqual(userAccount.contributedAmount.toNumber(), 0, "donated amount is not correct");
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

  xit("Creates a project successfully", async () => {
    const targetAmount = new anchor.BN(0.003 * anchor.web3.LAMPORTS_PER_SOL);
    const funding_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
    const delivery_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60);
    let taskID = getRandomId(); 
    const beforeUser = await program.account.user.fetch(userPda);
    let tuktukProgram = await init(provider);

    await program.methods
      .createProject({
        projectName: projectName1,
        targetAmount: targetAmount,
        fundingDeadline: funding_deadline,
        deliveryDeadline: delivery_deadline
      }, taskID)
      .accountsStrict({
        projectAuthority: user.publicKey,
        project: project1Pda,
        user: userPda,
        taskQueue: taskQueue,
        taskQueueAuthority: taskQueueAuthority,
        task: taskKey(taskQueue, taskID)[0],
        queueAuthority: queueAuthority,
        systemProgram: SystemProgram.programId,
        tuktukProgram: tuktukProgram.programId,
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

  xit("Allows a user to contribute for the first time", async () => {
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
    assert.strictEqual(afterUser.contributedAmount.toString(), beforeUser.contributedAmount.add(amount).toString());
    assert.strictEqual(afterVaultBalance, beforeVaultBalance + amount.toNumber());
  });

  xit("Aggregates contribution if same user contributes again", async () => {

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

  xit("Moves project to Development once target is reached", async () => {
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

  xit("Creates a milestone successfully", async () => {
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
      .createMilestone(milestoneType,taskId)
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
  });

  it("Full success lifecycle simulation", async () => {
    const targetAmount = new anchor.BN(0.003 * anchor.web3.LAMPORTS_PER_SOL);
    const funding_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
    const delivery_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60);
    let tuktukProgram = await init(provider);
    let taskID = getRandomId();
    const amount = new anchor.BN(0.01 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .createProject({
        projectName: projectName1,
        targetAmount: targetAmount,
        fundingDeadline: funding_deadline,
        deliveryDeadline: delivery_deadline
      }, taskID)
      .accountsStrict({
        projectAuthority: user.publicKey,
        project: project1Pda,
        user: userPda,
        taskQueue: taskQueue,
        taskQueueAuthority: taskQueueAuthority,
        task: taskKey(taskQueue, taskID)[0],
        queueAuthority: queueAuthority,
        systemProgram: SystemProgram.programId,
        tuktukProgram: tuktukProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Project created");

    // -----------------------
    // 3. Contributions
    // -----------------------

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor1.publicKey,
        vault: vaultPda,
        project: project2Pda,
        user: contributor1Pda,
        contribution: contribution12Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();
    console.log("Contributor 1 has contributed");

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor2.publicKey,
        vault: vaultPda,
        project: project2Pda,
        user: contributor2Pda,
        contribution: contribution22Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();
    console.log("Contributor 2 has contributed");

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor3.publicKey,
        vault: vaultPda,
        project: project2Pda,
        user: contributor3Pda,
        contribution: contribution32Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has contributed");

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor4.publicKey,
        vault: vaultPda,
        project: project2Pda,
        user: contributor4Pda,
        contribution: contribution42Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has contributed");

    await program.methods
      .contributeFund(amount)
      .accountsStrict({
        funder: contributor5.publicKey,
        vault: vaultPda,
        project: project2Pda,
        user: contributor5Pda,
        contribution: contribution52Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();

    console.log("Contributor 5 has contributed");

    // -----------------------
    // 4. Milestone 1
    // -----------------------
    const milestone1Type = { design: {} };
    let taskId = getRandomId();

    const [milestone1Pda] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(MILESTONE_SEED),
          user.publicKey.toBuffer(),
          project2Pda.toBuffer(),
          Buffer.from([0])
        ],
        program.programId
      );

    await program.methods
      .createMilestone(milestone1Type,taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        milestone: milestone1Pda,
        vault: vaultPda,
        project: project2Pda,
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

    console.log("Milestone 1 is created");

    const [vote1Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone1Pda.toBuffer(),
        contributor1.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote2Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone1Pda.toBuffer(),
        contributor2.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote3Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone1Pda.toBuffer(),
        contributor3.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote4Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone1Pda.toBuffer(),
        contributor4.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote5Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone1Pda.toBuffer(),
        contributor5.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor1.publicKey,
        user: contributor1Pda,
        project: project2Pda,
        milestone: milestone1Pda,
        contribution: contribution12Pda,
        vote: vote1Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    console.log("Contributor 1 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor2.publicKey,
        user: contributor2Pda,
        project: project2Pda,
        milestone: milestone1Pda,
        contribution: contribution22Pda,
        vote: vote2Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    console.log("Contributor 2 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor3.publicKey,
        user: contributor3Pda,
        project: project2Pda,
        milestone: milestone1Pda,
        contribution: contribution32Pda,
        vote: vote3Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor4.publicKey,
        user: contributor4Pda,
        project: project2Pda,
        milestone: milestone1Pda,
        contribution: contribution42Pda,
        vote: vote4Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor5.publicKey,
        user: contributor5Pda,
        project: project2Pda,
        milestone: milestone1Pda,
        contribution: contribution52Pda,
        vote: vote5Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();

    console.log("Contributor 5 has voted");

    await sleep(120 * 1000);

    // -----------------------
    // 5. Milestone 2
    // -----------------------
    const milestone2Type = { development: {} };
    taskId = getRandomId();

    const [milestone2Pda] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(MILESTONE_SEED),
          user.publicKey.toBuffer(),
          project2Pda.toBuffer(),
          Buffer.from([1])
        ],
        program.programId
      );

    await program.methods
      .createMilestone(milestone2Type, taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        milestone: milestone2Pda,
        vault: vaultPda,
        project: project2Pda,
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

    console.log("Milestone 2 is created");

    const [vote12Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone2Pda.toBuffer(),
        contributor1.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote22Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone2Pda.toBuffer(),
        contributor2.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote32Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone2Pda.toBuffer(),
        contributor3.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote42Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone2Pda.toBuffer(),
        contributor4.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote52Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone2Pda.toBuffer(),
        contributor5.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor1.publicKey,
        user: contributor1Pda,
        project: project2Pda,
        milestone: milestone2Pda,
        contribution: contribution12Pda,
        vote: vote12Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    console.log("Contributor 1 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor2.publicKey,
        user: contributor2Pda,
        project: project2Pda,
        milestone: milestone2Pda,
        contribution: contribution22Pda,
        vote: vote22Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    console.log("Contributor 2 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor3.publicKey,
        user: contributor3Pda,
        project: project2Pda,
        milestone: milestone2Pda,
        contribution: contribution32Pda,
        vote: vote32Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor4.publicKey,
        user: contributor4Pda,
        project: project2Pda,
        milestone: milestone2Pda,
        contribution: contribution42Pda,
        vote: vote42Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor5.publicKey,
        user: contributor5Pda,
        project: project2Pda,
        milestone: milestone2Pda,
        contribution: contribution52Pda,
        vote: vote52Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();

    console.log("Contributor 5 has voted");

    await sleep(120 * 1000);

    // -----------------------
    // 6. Milestone 3
    // -----------------------
    const milestone3Type = { testing: {} };
    taskId = getRandomId();

    const [milestone3Pda] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(MILESTONE_SEED),
          user.publicKey.toBuffer(),
          project2Pda.toBuffer(),
          Buffer.from([2])
        ],
        program.programId
      );

    await program.methods
      .createMilestone(milestone3Type,taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        milestone: milestone3Pda,
        vault: vaultPda,
        project: project2Pda,
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

    console.log("Milestone 3 is created");


    const [vote13Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone3Pda.toBuffer(),
        contributor1.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote23Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone3Pda.toBuffer(),
        contributor2.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote33Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone3Pda.toBuffer(),
        contributor3.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote43Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone3Pda.toBuffer(),
        contributor4.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote53Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone3Pda.toBuffer(),
        contributor5.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor1.publicKey,
        user: contributor1Pda,
        project: project2Pda,
        milestone: milestone3Pda,
        contribution: contribution12Pda,
        vote: vote13Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    console.log("Contributor 1 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor2.publicKey,
        user: contributor2Pda,
        project: project2Pda,
        milestone: milestone3Pda,
        contribution: contribution22Pda,
        vote: vote23Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    console.log("Contributor 2 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor3.publicKey,
        user: contributor3Pda,
        project: project2Pda,
        milestone: milestone3Pda,
        contribution: contribution32Pda,
        vote: vote33Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor4.publicKey,
        user: contributor4Pda,
        project: project2Pda,
        milestone: milestone3Pda,
        contribution: contribution42Pda,
        vote: vote43Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor5.publicKey,
        user: contributor5Pda,
        project: project2Pda,
        milestone: milestone3Pda,
        contribution: contribution52Pda,
        vote: vote53Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();

    console.log("Contributor 5 has voted");

    await sleep(120 * 1000);

    //-----------------------
    // 7. Milestone 4
    // -----------------------
    const milestone4Type = { deployment: {} };
    taskId = getRandomId();

    const [milestone4Pda] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from(MILESTONE_SEED),
          user.publicKey.toBuffer(),
          project2Pda.toBuffer(),
          Buffer.from([3])
        ],
        program.programId
      );

    await program.methods
      .createMilestone(milestone4Type, taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        milestone: milestone4Pda,
        vault: vaultPda,
        project: project2Pda,
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

    console.log("Milestone 4 is created");


    const [vote14Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone4Pda.toBuffer(),
        contributor1.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote24Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone4Pda.toBuffer(),
        contributor2.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote34Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone4Pda.toBuffer(),
        contributor3.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote44Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone4Pda.toBuffer(),
        contributor4.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [vote54Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(VOTE_SEED),
        milestone4Pda.toBuffer(),
        contributor5.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor1.publicKey,
        user: contributor1Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution12Pda,
        vote: vote14Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc();

    console.log("Contributor 1 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor2.publicKey,
        user: contributor2Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution22Pda,
        vote: vote24Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    console.log("Contributor 2 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor3.publicKey,
        user: contributor3Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution32Pda,
        vote: vote34Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor4.publicKey,
        user: contributor4Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution42Pda,
        vote: vote44Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor5.publicKey,
        user: contributor5Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution52Pda,
        vote: vote54Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();

    console.log("Contributor 5 has voted");

    await sleep(120 * 1000);

    //-----------------------
    // 8. Retry Milestone
    // -----------------------
    await program.methods
      .retryMilestone(taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey,
        project: project2Pda,
        milestone: milestone4Pda,
        user: userPda,
        vault: vaultPda,
        taskQueue: taskQueue,
        taskQueueAuthority: taskQueueAuthority,
        task: taskKey(taskQueue, taskId)[0],
        queueAuthority: queueAuthority,
        systemProgram: SystemProgram.programId,
        tuktukProgram: tuktukProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Retrying milestone...")

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor1.publicKey,
        user: contributor1Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution12Pda,
        vote: vote14Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor1])
      .rpc({
        skipPreflight: true
      });

    console.log("Contributor 1 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor2.publicKey,
        user: contributor2Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution22Pda,
        vote: vote24Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor2])
      .rpc();

    console.log("Contributor 2 has voted");

    await program.methods
      .voteOnMilestone(false)
      .accountsStrict({
        voter: contributor3.publicKey,
        user: contributor3Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution32Pda,
        vote: vote34Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor3])
      .rpc();

    console.log("Contributor 3 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor4.publicKey,
        user: contributor4Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution42Pda,
        vote: vote44Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor4])
      .rpc();

    console.log("Contributor 4 has voted");

    await program.methods
      .voteOnMilestone(true)
      .accountsStrict({
        voter: contributor5.publicKey,
        user: contributor5Pda,
        project: project2Pda,
        milestone: milestone4Pda,
        contribution: contribution52Pda,
        vote: vote54Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor5])
      .rpc();
    
    console.log("Contributor 5 has voted");

    console.log("Waiting for crank to resolve the final retried milestone...");

    await sleep(120 * 1000);

    const finalProject = await program.account.project.fetch(project2Pda);
    const finalMilestone4 = await program.account.milestone.fetch(milestone4Pda);
    const finalCreator = await program.account.user.fetch(userPda);

    assert.ok(
      finalProject.projectState.completed !== undefined,
      "Project state should be Completed"
    );
    assert.strictEqual(
      finalProject.milestonesCompleted,
      4,
      "Project should have exactly 4 completed milestones"
    );
    assert.isAbove(
      finalProject.withdrawnAmount.toNumber(),
      0,
      "Developer should have successfully withdrawn funds"
    );

    assert.ok(
      finalMilestone4.milestoneStatus.approved !== undefined,
      "Milestone 4 should be Approved after the retry"
    );
    assert.strictEqual(
      finalMilestone4.attemptNumber,
      1,
      "Milestone 4 should reflect it succeeded on Attempt 1 (the first retry)"
    );

    assert.isAbove(
      finalCreator.projectsSucceeded.toNumber(),
      0,
      "Creator's successful project count should be incremented"
    );
    assert.strictEqual(
      finalCreator.milestonesSucceeded.toNumber(),
      4,
      "Creator's cleared milestone count should reflect all 4 milestones"
    );
  });
});