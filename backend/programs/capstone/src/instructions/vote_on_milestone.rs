use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;
use crate::errors::Error; 
use crate::state::*;

#[derive(Accounts)]
pub struct VoteMilestone<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.key().as_ref(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [MILESTONE_SEED, project.project_name.as_bytes(), &[milestone.milestone_type as u8]],
        bump = project.bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        associated_token::mint = vault_mint,
        associated_token::authority = voter,
    )]
    pub voter_receipt_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        space = Vote::DISCRIMINATOR.len() +  Vote::INIT_SPACE,
        seeds= [VOTE_SEED, project.project_name.as_ref(), &[milestone.milestone_type as u8], voter.key().as_ref()],
        payer = voter,
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        mut,
        seeds = [USER_SEED, voter.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    pub vault_mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    pub system_program: Program<'info, System>,
}

impl<'info> VoteMilestone<'info> {
    pub fn vote_milestone(&mut self, decision: bool) -> Result<()> {
        let clock = Clock::get()?;

        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage  
        );

        require!(
            clock.unix_timestamp <= self.milestone.milestone_deadline,
            Error::NotVotingStage
        );

        let voting_weight = self.voter_receipt_ata.amount;
        require!(voting_weight > 0, Error::NotVotingStage);

        self.vote.set_inner(Vote {
            voter: self.voter.key(),
            project_id: self.project.key(),
            milestone_id: self.milestone.key(),
            decision,
            weight: voting_weight,
            bump: self.vote.bump, 
        });

        if decision {
            self.milestone.vote_for = self.milestone.vote_for.checked_add(1).unwrap();
            self.milestone.vote_for_weight = self.milestone.vote_for_weight.checked_add(voting_weight).unwrap();
            
        } else {
            self.milestone.vote_against = self.milestone.vote_against.checked_add(1).unwrap();
            self.milestone.vote_against_weight = self.milestone.vote_against_weight.checked_add(voting_weight).unwrap();
        }

        self.user.total_votes = self.user.total_votes.checked_add(1).unwrap();
        self.user.last_active_time = clock.unix_timestamp;

        Ok(())

    }
}