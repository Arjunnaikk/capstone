use anchor_lang::prelude::*;
use crate::{errors::Error, state::*};

const QUORUM_PERCENT: u64 = 30; 
const BPS_DENOMINATOR: u64 = 10000;
const MAX_ATTEMPTS: u8 = 3;

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    // no signer needed for automation
    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_name.as_bytes(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        constraint = milestone.project_id == project.key() @ Error::InvalidProject,
        seeds= [MILESTONE_SEED, project.project_authority.key().as_ref(), project.key().as_ref(), &[milestone.milestone_type as u8]],
        bump = milestone.bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        mut,
        seeds = [USER_SEED, project.project_authority.as_ref()],
        bump = creator_user.bump
    )]
    pub creator_user: Account<'info, User>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: only sending SOL to the exact pubkey stored in the Project state
    #[account(
        mut,
        address = project.project_authority
    )]
    pub project_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> ApproveMilestone<'info> {
    pub fn approve_milestone(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage 
        );

        // require!(
        //     current_time > self.milestone.voting_end_time,
        //     Error::NotVotingStage 
        // );

        let required_funder_quorum = (self.project.funder_count as u64)
            .saturating_mul(QUORUM_PERCENT)
            .checked_div(100).unwrap_or(0);
        
        let required_capital_quorum = self.project.collected_amount
            .saturating_mul(QUORUM_PERCENT)
            .checked_div(100).unwrap_or(0);

        let headcount_passed = (self.milestone.votes_casted as u64) >= required_funder_quorum;
        let capital_passed = self.milestone.amount_voted >= required_capital_quorum;

        if headcount_passed && capital_passed && self.milestone.vote_for_weight > self.milestone.vote_against_weight {
            
            self.milestone.milestone_status = MilestoneState::Approved;
            
            self.project.milestones_completed = self.project.milestones_completed.saturating_add(1);
            
            self.creator_user.milestones_cleared = self.creator_user.milestones_cleared.saturating_add(1);
         
            if self.project.milestones_completed >= 5 {
                self.project.project_state = ProjectState::Completed;
                self.creator_user.projects_succeed = self.creator_user.projects_succeed.saturating_add(1);
            }

            let payout_amount = self.project.collected_amount
                .saturating_mul(self.milestone.milestone_claim as u64)
                .checked_div(BPS_DENOMINATOR)
                .unwrap_or(0);

            let remaining_funds = self.project.collected_amount.saturating_sub(self.project.withdrawn_amount);
            require!(payout_amount <= remaining_funds, Error::InsufficientFunds);

            **self.vault.to_account_info().lamports.borrow_mut() = self.vault.to_account_info().lamports()
                .checked_sub(payout_amount)
                .ok_or(Error::InsufficientFunds)?;
            **self.project_authority.lamports.borrow_mut() = self.project_authority.lamports()
                .checked_add(payout_amount)
                .unwrap();

            self.project.withdrawn_amount = self.project.withdrawn_amount.saturating_add(payout_amount);

        } else {
            self.milestone.milestone_status = MilestoneState::Disapproved;

            if current_time > self.project.project_deadline || self.milestone.attempt_number >= MAX_ATTEMPTS {
                self.project.project_state = ProjectState::Failed;
            }
        }

        Ok(())
    }
}