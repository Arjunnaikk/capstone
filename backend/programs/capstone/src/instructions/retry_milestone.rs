use crate::{accounts::ApproveMilestone, errors::Error, state::*};
use anchor_lang::{InstructionData, prelude::*};
use anchor_lang::solana_program::instruction::Instruction;

use tuktuk_program::{
    compile_transaction,
    tuktuk::{
        cpi::{accounts::QueueTaskV0, queue_task_v0},
        program::Tuktuk,
        types::TriggerV0,
    },
    types::QueueTaskArgsV0,
    TransactionSourceV0,
};

const VOTING_WINDOW_SECONDS: i64 = 172_800; // 48 hours in seconds
const MAX_ATTEMPTS: u8 = 3;

#[derive(Accounts)]
pub struct RetryMilestone<'info> {
    #[account(mut)]
    pub milestone_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), milestone_authority.key().as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        constraint = milestone.project_id == project.key() @ Error::InvalidProject
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        mut,
        seeds = [USER_SEED, milestone_authority.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    /// CHECK: Don't need to parse this account, just using it in CPI
    pub task_queue: UncheckedAccount<'info>,

    /// CHECK: Don't need to parse this account, just using it in CPI
    pub task_queue_authority: UncheckedAccount<'info>,

    /// CHECK: Initialized in CPI
    #[account(mut)]
    pub task: UncheckedAccount<'info>,

    /// CHECK: Via seeds
    #[account(
        mut,
        seeds = [b"queue_authority"],
        bump
    )]
    pub queue_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub tuktuk_program: Program<'info, Tuktuk>,
}

impl<'info> RetryMilestone<'info> {
    pub fn retry_milestone(&mut self, task_id: u16,
        bumps: &RetryMilestoneBumps) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let deadline = current_time.checked_add(172_800).unwrap();

        require!(
            self.milestone.milestone_status == MilestoneState::Disapproved,
            Error::NotDisapproved
        );

        require!(
            self.milestone.attempt_number < MAX_ATTEMPTS,
            Error::MaxAttemptsReached
        );

        let new_voting_deadline = current_time.saturating_add(VOTING_WINDOW_SECONDS);

        require!(
            new_voting_deadline <= self.project.project_deadline,
            Error::NotEnoughTimeLeft
        );

        self.milestone.vote_for_weight = 0;
        self.milestone.vote_against_weight = 0;
        self.milestone.votes_casted = 0;
        self.milestone.amount_voted = 0;
        self.milestone.attempt_number = self.milestone.attempt_number.saturating_add(1);
        self.milestone.milestone_status = MilestoneState::Voting;

        self.user.last_active_time = clock.unix_timestamp;
        self.user.milestones_posted = self.user.milestones_posted.checked_add(1).unwrap();

        let (compiled_tx, _) = compile_transaction(
            vec![Instruction {
                program_id: crate::ID,
                accounts: crate::__client_accounts_approve_milestone::ApproveMilestone {
                    project: self.project.key(),
                    milestone: self.milestone.key(),
                    creator_user: self.milestone_authority.key(),
                    vault: self.vault.key(),
                    project_authority: self.milestone_authority.key(),
                    system_program: self.system_program.key(),
                }
                .to_account_metas(None)
                .to_vec(),
                data: crate::instruction::ApproveMilestone {}.data(),
            }],
            vec![],
        )
        .unwrap();
        queue_task_v0(
            CpiContext::new_with_signer(
                self.tuktuk_program.to_account_info(),
                QueueTaskV0 {
                    payer: self.user.to_account_info(),
                    queue_authority: self.queue_authority.to_account_info(),
                    task_queue: self.task_queue.to_account_info(),
                    task_queue_authority: self.task_queue_authority.to_account_info(),
                    task: self.task.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                &[&["queue_authority".as_bytes(), &[bumps.queue_authority]]],
            ),
            QueueTaskArgsV0 {
                trigger: TriggerV0::Timestamp(deadline),
                transaction: TransactionSourceV0::CompiledV0(compiled_tx),
                crank_reward: Some(1000001),
                free_tasks: 1,
                id: task_id,
                description: "test".to_string(),
            },
        )?;

        Ok(())
    }
}
