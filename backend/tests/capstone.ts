import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Capstone } from "../target/types/capstone";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import fs from "fs";
import { init, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";

describe("capstone", async () => {
  const provider = anchor.AnchorProvider.local("https://devnet.helius-rpc.com/?api-key=c5d32b63-b2f3-46b9-9535-0d5510769438");
  anchor.setProvider(provider);

  const program = anchor.workspace.capstone as Program<Capstone>;

  // Wallet & Utils Setup
 
  function loadWallet(path: string): Keypair {
    const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }

  function getRandomId(): number {
    return Math.floor(Math.random() * 1000) + 1;
  }

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const admin = loadWallet("./wallets/admin.json");
  const user = loadWallet("./wallets/user.json");
  const contributor1 = loadWallet("./wallets/contributor1.json");
  const contributor2 = loadWallet("./wallets/contributor2.json");
  const contributor3 = loadWallet("./wallets/contributor3.json");
  const contributor4 = loadWallet("./wallets/contributor4.json");
  const contributor5 = loadWallet("./wallets/contributor5.json");

  // PDA Derivation Helpers
  const VAULT_SEED = "VAULT";
  const PROJECT_SEED = "PROJECT";
  const CONTRIBUTION_SEED = "CONTRIBUTION";
  const MILESTONE_SEED = "MILESTONE";
  const USER_SEED = "USER";
  const VOTE_SEED = "VOTE";

  function getVaultPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from(VAULT_SEED)], program.programId);
  }

  function getUserPda(wallet: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from(USER_SEED), wallet.toBuffer()], program.programId);
  }

  function getProjectPda(name: string, authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(PROJECT_SEED), Buffer.from(name), authority.toBuffer()],
      program.programId
    );
  }

  function getContributionPda(funder: PublicKey, project: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_SEED), funder.toBuffer(), project.toBuffer()],
      program.programId
    );
  }

  function getMilestonePda(authority: PublicKey, project: PublicKey, typeIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(MILESTONE_SEED), authority.toBuffer(), project.toBuffer(), Buffer.from([typeIndex])],
      program.programId
    );
  }

  function getVotePda(milestone: PublicKey, voter: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(VOTE_SEED), milestone.toBuffer(), voter.toBuffer()],
      program.programId
    );
  }

  // Global Test State Variables

  let vaultPda: PublicKey;
  let vaultBump: number;
  let userPda: PublicKey;
  let userBump: number;

  let contributor1Pda: PublicKey, contributor2Pda: PublicKey, contributor3Pda: PublicKey, contributor4Pda: PublicKey, contributor5Pda: PublicKey;

  // Project 1 PDAs
  let project1Pda: PublicKey, project1Bump: number;
  let contribution1Pda: PublicKey, contribution2Pda: PublicKey, contribution3Pda: PublicKey, contribution4Pda: PublicKey, contribution5Pda: PublicKey;

  // Project 2 PDAs
  let project2Pda: PublicKey, project2Bump: number;
  let contribution12Pda: PublicKey, contribution22Pda: PublicKey, contribution32Pda: PublicKey, contribution42Pda: PublicKey, contribution52Pda: PublicKey;

  const projectName1 = "MyTestProject1";
  const projectName2 = "MyTestProject2";

  // Tuktuk setup
  let tuktukProgram: any;
  let taskId = getRandomId();
  const taskQueue = new anchor.web3.PublicKey("GnCH4xcCtPTqiHa3z76dPW4DX7toa6qCntNJVtwS5KZc");
  const queueAuthority = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("queue_authority")], program.programId)[0];
  const taskQueueAuthority = taskQueueAuthorityKey(taskQueue, queueAuthority)[0];
  console.log("queueAuthority: ", queueAuthority);

  before(async () => {
    tuktukProgram = await init(provider);

    [vaultPda, vaultBump] = getVaultPda();
    [userPda, userBump] = getUserPda(user.publicKey);

    [contributor1Pda] = getUserPda(contributor1.publicKey);
    [contributor2Pda] = getUserPda(contributor2.publicKey);
    [contributor3Pda] = getUserPda(contributor3.publicKey);
    [contributor4Pda] = getUserPda(contributor4.publicKey);
    [contributor5Pda] = getUserPda(contributor5.publicKey);

    [project1Pda, project1Bump] = getProjectPda(projectName1, user.publicKey);
    [project2Pda, project2Bump] = getProjectPda(projectName2, user.publicKey);

    [contribution1Pda] = getContributionPda(contributor1.publicKey, project1Pda);
    [contribution2Pda] = getContributionPda(contributor2.publicKey, project1Pda);
    [contribution3Pda] = getContributionPda(contributor3.publicKey, project1Pda);
    [contribution4Pda] = getContributionPda(contributor4.publicKey, project1Pda);
    [contribution5Pda] = getContributionPda(contributor5.publicKey, project1Pda);

    [contribution12Pda] = getContributionPda(contributor1.publicKey, project2Pda);
    [contribution22Pda] = getContributionPda(contributor2.publicKey, project2Pda);
    [contribution32Pda] = getContributionPda(contributor3.publicKey, project2Pda);
    [contribution42Pda] = getContributionPda(contributor4.publicKey, project2Pda);
    [contribution52Pda] = getContributionPda(contributor5.publicKey, project2Pda);
  });

  xit("Initializes vault PDA", async () => {
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
    console.log(`\n=== Vault Initialized ===\n  PDA: ${vaultPda.toBase58()}\n  Authority: ${vaultAccount.authority.toBase58()}`);

    assert.strictEqual(vaultAccount.authority.toString(), admin.publicKey.toString());
    assert.strictEqual(vaultAccount.bump, vaultBump);
  });

  xit("Initializes a user PDA", async () => {
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
    console.log(`\n=== Developer User Initialized ===\n  PDA: ${userPda.toBase58()}\n  Wallet: ${user.publicKey.toBase58()}\n  Joined: ${new Date(userAccount.timeJoined.toNumber() * 1000).toLocaleString()}`);

    assert.strictEqual(userAccount.contributedAmount.toNumber(), 0);
    assert.strictEqual(userAccount.projectsPosted.toNumber(), 0);
    assert.strictEqual(userAccount.bump, userBump);
    assert.isAtLeast(userAccount.timeJoined.toNumber(), beforeTs);
  });

  xit("Initializes contributor's user PDAs", async () => {
    const contributors = [
      { key: contributor1, pda: contributor1Pda, name: "Contributor 1" },
      { key: contributor2, pda: contributor2Pda, name: "Contributor 2" },
      { key: contributor3, pda: contributor3Pda, name: "Contributor 3" },
      { key: contributor4, pda: contributor4Pda, name: "Contributor 4" },
      { key: contributor5, pda: contributor5Pda, name: "Contributor 5" }
    ];

    for (const c of contributors) {
      await program.methods
        .initializeUser()
        .accountsStrict({
          user: c.key.publicKey,
          userAccount: c.pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([c.key])
        .rpc();
    }

    const fetches = await Promise.all(contributors.map(c => program.account.user.fetch(c.pda)));

    console.log("\n=== Contributor User PDAs Initialized ===");
    console.table(contributors.map((c, i) => ({
      Alias: c.name,
      PDA: c.pda.toBase58(),
      Wallet: c.key.publicKey.toBase58(),
      Contributed_SOL: fetches[i].contributedAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
    })));
  });

  xit("Creates a project successfully", async () => {
    const targetAmount = new anchor.BN(0.005 * anchor.web3.LAMPORTS_PER_SOL);
    const funding_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
    const delivery_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60);
    taskId = getRandomId();
    const beforeUser = await program.account.user.fetch(userPda);

    await program.methods
      .createProject({
        projectName: projectName1,
        targetAmount: targetAmount,
        fundingDeadline: funding_deadline,
        deliveryDeadline: delivery_deadline
      }, taskId)
      .accountsStrict({
        projectAuthority: user.publicKey,
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
      .rpc();

    const projectAccount = await program.account.project.fetch(project1Pda);
    const afterUser = await program.account.user.fetch(userPda);

    console.log(`\n=== Project 1 Created ===\n  PDA: ${project1Pda.toBase58()}\n  Name: ${projectAccount.projectName}\n  Target: ${projectAccount.targetAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL\n  Status: ${Object.keys(projectAccount.projectState)[0]}`);

    assert.strictEqual(projectAccount.projectAuthority.toString(), user.publicKey.toString());
    assert.strictEqual(projectAccount.projectName, projectName1);
    assert.strictEqual(projectAccount.targetAmount.toString(), targetAmount.toString());
    assert.strictEqual(projectAccount.collectedAmount.toNumber(), 0);
    assert.strictEqual(projectAccount.bump, project1Bump);
    assert.strictEqual(afterUser.projectsPosted.toNumber(), beforeUser.projectsPosted.toNumber() + 1);
  });

  xit("Moves project to Development stage on reaching target", async () => {
    const amount = new anchor.BN(0.001 * anchor.web3.LAMPORTS_PER_SOL);
    const contributors = [
      { key: contributor1, cPda: contributor1Pda, contPda: contribution1Pda, name: "Contributor 1" },
      { key: contributor2, cPda: contributor2Pda, contPda: contribution2Pda, name: "Contributor 2" },
      { key: contributor3, cPda: contributor3Pda, contPda: contribution3Pda, name: "Contributor 3" },
      { key: contributor4, cPda: contributor4Pda, contPda: contribution4Pda, name: "Contributor 4" },
      { key: contributor5, cPda: contributor5Pda, contPda: contribution5Pda, name: "Contributor 5" }
    ];

    for (const c of contributors) {
      await program.methods
        .contributeFund(amount)
        .accountsStrict({
          funder: c.key.publicKey,
          vault: vaultPda,
          project: project1Pda,
          user: c.cPda,
          contribution: c.contPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([c.key])
        .rpc();
    }

    const fetches = await Promise.all(contributors.map(c => program.account.contribution.fetch(c.contPda)));

    console.log("\n=== Project 1 Contributions ===");
    console.table(contributors.map((c, i) => ({
      Alias: c.name,
      ContributionPDA: c.contPda.toBase58(),
      Amount_SOL: fetches[i].amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      Refunded: fetches[i].refunded,
    })));

    const updatedProject = await program.account.project.fetch(project1Pda);
    console.log(`\nProject 1 Updated State: ${Object.keys(updatedProject.projectState)[0]}`);

    assert.ok(updatedProject.projectState.development !== undefined);
  });

  xit("Initialize a milestone PDA for project", async () => {
    const milestoneType = { design: {} };
    taskId = getRandomId();
    const [milestonePda, milestoneBump] = getMilestonePda(user.publicKey, project1Pda, 0);

    await program.methods
      .createMilestone(milestoneType, taskId)
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
      .rpc({ skipPreflight: true });

    const milestoneAccount = await program.account.milestone.fetch(milestonePda);

    console.log(`\n=== Milestone 1 Created (Project 1) ===\n  PDA: ${milestonePda.toBase58()}\n  Type: ${Object.keys(milestoneAccount.milestoneType)[0]}\n  Status: ${Object.keys(milestoneAccount.milestoneStatus)[0]}\n  Attempt: ${milestoneAccount.attemptNumber}`);

    assert.strictEqual(milestoneAccount.projectId.toString(), project1Pda.toString());
    assert.strictEqual(milestoneAccount.attemptNumber, 1);
    assert.ok(milestoneAccount.milestoneStatus.voting !== undefined);
    assert.strictEqual(milestoneAccount.voteForWeight.toNumber(), 0);
    assert.strictEqual(milestoneAccount.voteAgainstWeight.toNumber(), 0);
    assert.strictEqual(milestoneAccount.bump, milestoneBump);
  });

  xit("Failure lifecycle simulation", async () => {
    const [milestone1Pda] = getMilestonePda(user.publicKey, project1Pda, 0);

    const votePDAs = [
      getVotePda(milestone1Pda, contributor1.publicKey)[0],
      getVotePda(milestone1Pda, contributor2.publicKey)[0],
      getVotePda(milestone1Pda, contributor3.publicKey)[0],
      getVotePda(milestone1Pda, contributor4.publicKey)[0],
      getVotePda(milestone1Pda, contributor5.publicKey)[0]
    ];

    const voters = [
      { key: contributor1, cPda: contributor1Pda, contPda: contribution1Pda, votePda: votePDAs[0], decision: false, name: "Contributor 1" },
      { key: contributor2, cPda: contributor2Pda, contPda: contribution2Pda, votePda: votePDAs[1], decision: false, name: "Contributor 2" },
      { key: contributor3, cPda: contributor3Pda, contPda: contribution3Pda, votePda: votePDAs[2], decision: false, name: "Contributor 3" },
      { key: contributor4, cPda: contributor4Pda, contPda: contribution4Pda, votePda: votePDAs[3], decision: true, name: "Contributor 4" },
      { key: contributor5, cPda: contributor5Pda, contPda: contribution5Pda, votePda: votePDAs[4], decision: true, name: "Contributor 5" }
    ];

    // --- ATTEMPT 1 ---
    for (const v of voters) {
      await program.methods
        .voteOnMilestone(v.decision)
        .accountsStrict({
          voter: v.key.publicKey, user: v.cPda, project: project1Pda, milestone: milestone1Pda,
          contribution: v.contPda, vote: v.votePda, systemProgram: SystemProgram.programId,
        }).signers([v.key]).rpc();
    }
    let fetches = await Promise.all(voters.map(v => program.account.vote.fetch(v.votePda)));
    console.log("\n=== Project 1, Milestone 1: Voting (Attempt 1) ===");
    console.table(voters.map((v, i) => ({ Alias: v.name, VotePDA: v.votePda.toBase58(), Decision: fetches[i].decision ? "APPROVE" : "REJECT", Weight: fetches[i].weight.toNumber(), Attempt: fetches[i].attemptCount })));

    console.log("\nWaiting for crank to resolve Attempt 1...");
    await sleep(180 * 1000);

    // --- ATTEMPT 2 ---
    taskId = getRandomId();
    await program.methods
      .retryMilestone(taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey, project: project1Pda, milestone: milestone1Pda, user: userPda, vault: vaultPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc();
    console.log("\nMilestone Retry 1 Triggered.");

    for (const v of voters) {
      await program.methods
        .voteOnMilestone(v.decision)
        .accountsStrict({
          voter: v.key.publicKey, user: v.cPda, project: project1Pda, milestone: milestone1Pda,
          contribution: v.contPda, vote: v.votePda, systemProgram: SystemProgram.programId,
        }).signers([v.key]).rpc();
    }
    fetches = await Promise.all(voters.map(v => program.account.vote.fetch(v.votePda)));
    console.log("\n=== Project 1, Milestone 1: Voting (Attempt 2) ===");
    console.table(voters.map((v, i) => ({ Alias: v.name, VotePDA: v.votePda.toBase58(), Decision: fetches[i].decision ? "APPROVE" : "REJECT", Weight: fetches[i].weight.toNumber(), Attempt: fetches[i].attemptCount })));

    console.log("\nWaiting for crank to resolve Attempt 2...");
    await sleep(180 * 1000);

    // --- ATTEMPT 3 ---
    taskId = getRandomId();
    await program.methods
      .retryMilestone(taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey, project: project1Pda, milestone: milestone1Pda, user: userPda, vault: vaultPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc();
    console.log("\nMilestone Retry 2 Triggered.");

    for (const v of voters) {
      await program.methods
        .voteOnMilestone(v.decision)
        .accountsStrict({
          voter: v.key.publicKey, user: v.cPda, project: project1Pda, milestone: milestone1Pda,
          contribution: v.contPda, vote: v.votePda, systemProgram: SystemProgram.programId,
        }).signers([v.key]).rpc();
    }
    fetches = await Promise.all(voters.map(v => program.account.vote.fetch(v.votePda)));
    console.log("\n=== Project 1, Milestone 1: Voting (Attempt 3) ===");
    console.table(voters.map((v, i) => ({ Alias: v.name, VotePDA: v.votePda.toBase58(), Decision: fetches[i].decision ? "APPROVE" : "REJECT", Weight: fetches[i].weight.toNumber(), Attempt: fetches[i].attemptCount })));

    console.log("\nWaiting for final failure resolution...");
    await sleep(120 * 1000);

    const project1 = await program.account.project.fetch(project1Pda);
    const milestone1 = await program.account.milestone.fetch(milestone1Pda);

    console.log(`\n=== Project 1 Final Resolution ===\n  Milestone Status: ${Object.keys(milestone1.milestoneStatus)[0]}\n  Project State: ${Object.keys(project1.projectState)[0]}`);

    assert.ok(milestone1.milestoneStatus.disapproved !== undefined, "Milestone is approved even after all the retries");
    assert.ok(project1.projectState.failed !== undefined, "Project is not marked as failed");
  });

  xit("Success lifecycle simulation", async () => {
    const targetAmount = new anchor.BN(0.05 * anchor.web3.LAMPORTS_PER_SOL);
    const funding_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
    const delivery_deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60);
    const amount = new anchor.BN(0.01 * anchor.web3.LAMPORTS_PER_SOL);
    taskId = getRandomId();

    await program.methods
      .createProject({
        projectName: projectName2, targetAmount, fundingDeadline: funding_deadline, deliveryDeadline: delivery_deadline
      }, taskId)
      .accountsStrict({
        projectAuthority: user.publicKey, project: project2Pda, user: userPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc();

    const p2Acc = await program.account.project.fetch(project2Pda);
    console.log(`\n=== Project 2 Created ===\n  PDA: ${project2Pda.toBase58()}\n  Name: ${p2Acc.projectName}\n  Status: ${Object.keys(p2Acc.projectState)[0]}`);

    // --- Contributions ---
    const contributors = [
      { key: contributor1, cPda: contributor1Pda, contPda: contribution12Pda, name: "Contributor 1" },
      { key: contributor2, cPda: contributor2Pda, contPda: contribution22Pda, name: "Contributor 2" },
      { key: contributor3, cPda: contributor3Pda, contPda: contribution32Pda, name: "Contributor 3" },
      { key: contributor4, cPda: contributor4Pda, contPda: contribution42Pda, name: "Contributor 4" },
      { key: contributor5, cPda: contributor5Pda, contPda: contribution52Pda, name: "Contributor 5" }
    ];

    for (const c of contributors) {
      await program.methods
        .contributeFund(amount)
        .accountsStrict({
          funder: c.key.publicKey, vault: vaultPda, project: project2Pda, user: c.cPda,
          contribution: c.contPda, systemProgram: SystemProgram.programId,
        }).signers([c.key]).rpc();
    }

    const contFetches = await Promise.all(contributors.map(c => program.account.contribution.fetch(c.contPda)));
    console.log("\n=== Project 2 Contributions ===");
    console.table(contributors.map((c, i) => ({ Alias: c.name, ContributionPDA: c.contPda.toBase58(), Amount_SOL: contFetches[i].amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL })));

    // Helper function for voting rounds
    async function runMilestoneRound(milestoneIndex: number, milestoneTypeObj: any, decisions: boolean[]) {
      taskId = getRandomId();
      const [mPda] = getMilestonePda(user.publicKey, project2Pda, milestoneIndex);

      await program.methods
        .createMilestone(milestoneTypeObj, taskId)
        .accountsStrict({
          milestoneAuthority: user.publicKey, milestone: mPda, vault: vaultPda, project: project2Pda, user: userPda,
          taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
          systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
        }).signers([user]).rpc({ skipPreflight: true });

      const mAcc = await program.account.milestone.fetch(mPda);
      console.log(`\n=== Milestone ${milestoneIndex + 1} Created ===\n  PDA: ${mPda.toBase58()}\n  Type: ${Object.keys(mAcc.milestoneType)[0]}`);

      const votePDAs = contributors.map(c => getVotePda(mPda, c.key.publicKey)[0]);

      for (let i = 0; i < contributors.length; i++) {
        await program.methods
          .voteOnMilestone(decisions[i])
          .accountsStrict({
            voter: contributors[i].key.publicKey, user: contributors[i].cPda, project: project2Pda, milestone: mPda,
            contribution: contributors[i].contPda, vote: votePDAs[i], systemProgram: SystemProgram.programId,
          }).signers([contributors[i].key]).rpc();
      }

      const voteFetches = await Promise.all(votePDAs.map(v => program.account.vote.fetch(v)));
      console.log(`\n=== Project 2, Milestone ${milestoneIndex + 1}: Voting Results ===`);
      console.table(contributors.map((c, i) => ({ Alias: c.name, VotePDA: votePDAs[i].toBase58(), Decision: voteFetches[i].decision ? "APPROVE" : "REJECT", Weight: voteFetches[i].weight.toNumber() })));

      console.log(`Waiting for crank to resolve Milestone ${milestoneIndex + 1}...`);
      await sleep(180 * 1000);
      return mPda;
    }

    await runMilestoneRound(0, { design: {} }, [true, true, false, true, false]);
    await runMilestoneRound(1, { development: {} }, [true, true, false, true, false]);
    await runMilestoneRound(2, { testing: {} }, [true, true, false, true, false]);
    const milestone4Pda = await runMilestoneRound(3, { deployment: {} }, [true, true, true, true, true]);

    const finalProject = await program.account.project.fetch(project2Pda);
    const finalMilestone4 = await program.account.milestone.fetch(milestone4Pda);
    const finalCreator = await program.account.user.fetch(userPda);

    console.log(`\n=== Project 2 Final Resolution ===\n  Project State: ${Object.keys(finalProject.projectState)[0]}\n  Milestones Cleared: ${finalProject.milestonesCompleted}`);

    assert.ok(finalProject.projectState.completed !== undefined, "Project state should be Completed");
    assert.strictEqual(finalProject.milestonesCompleted, 4, "Project should have exactly 4 completed milestones");
    assert.isAbove(finalProject.withdrawnAmount.toNumber(), 0, "Developer should have successfully withdrawn funds");
    assert.ok(finalMilestone4.milestoneStatus.approved !== undefined, "Milestone 4 should be approved");
    assert.isAbove(finalCreator.projectsSucceeded.toNumber(), 0, "Creator's successful project count should be incremented");
    assert.strictEqual(finalCreator.milestonesSucceeded.toNumber(), 4, "Creator's cleared milestone count should reflect all 4 milestones");
  });
});