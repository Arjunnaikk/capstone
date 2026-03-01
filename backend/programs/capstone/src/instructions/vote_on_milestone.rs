use anchor_lang::prelude::*;
use crate::{errors::Error, state::*};

const MAX_BONUS: u64 = 9;
const MAX_WEIGHT: u64 = 5_000;
const HALF_LIFE: u64 = 100; 

pub fn integer_sqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[derive(Accounts)]
pub struct VoteMilestone<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_SEED, voter.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    #[account(
        seeds = [PROJECT_SEED, project.project_name.as_bytes(),project.project_authority.as_ref()],
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
        seeds = [CONTRIBUTION_SEED,  voter.key().as_ref(), project.key().as_ref()],
        constraint = contribution.funder == voter.key() @ Error::InvalidProject,
        constraint = contribution.project == project.key() @ Error::InvalidProject,
        bump = contribution.bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(
        init,
        space = 8 + Vote::INIT_SPACE,
        seeds = [VOTE_SEED, milestone.key().as_ref(), voter.key().as_ref()],
        payer = voter,
        bump
    )]
    pub vote: Account<'info, Vote>,

    pub system_program: Program<'info, System>,
}

impl<'info> VoteMilestone<'info> {
    pub fn vote_milestone(&mut self, decision: bool, bumps: VoteMilestoneBumps) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(
            self.milestone.milestone_status == MilestoneState::Voting,
            Error::NotVotingStage
        );

        require!(
            current_time <= self.project.project_deadline,
            Error::NotEnoughTimeLeft
        );

        let tokens = self.contribution.amount;
        require!(tokens > 0, Error::ZeroAmount);


        let failed_projects = self.user
            .projects_posted
            .saturating_sub(self.user.projects_succeed);

        let raw_score = self.user.total_votes
            .saturating_add(self.user.milestones_cleared.saturating_mul(5))
            .saturating_add(self.user.projects_succeed.saturating_mul(20));

        let penalty = failed_projects.saturating_mul(10);
        let adjusted_score = raw_score.saturating_sub(penalty);

        let mut reputation = 1u64;

        if adjusted_score > 0 {
            let numerator = MAX_BONUS.saturating_mul(adjusted_score);
            let denominator = adjusted_score.saturating_add(HALF_LIFE);
            let bounded_bonus = numerator.saturating_div(denominator);
            reputation = reputation.saturating_add(bounded_bonus);
        }

        let seconds_since_active = current_time
            .checked_sub(self.user.last_active_time)
            .unwrap_or(0);

        let days_inactive = (seconds_since_active / 86_400) as u64;

        let decayed_rep = HALF_LIFE
            .saturating_mul(reputation)
            .checked_div(HALF_LIFE.saturating_add(days_inactive))
            .unwrap_or(1);

        reputation = decayed_rep.max(1);

        let base_power = integer_sqrt(tokens);

        let weight_u128 = (base_power as u128)
            .checked_mul(reputation as u128)
            .ok_or(Error::Overflow)?;

        require!(weight_u128 <= u64::MAX as u128, Error::Overflow);

        let mut final_voting_weight = weight_u128 as u64;

        final_voting_weight = final_voting_weight.min(MAX_WEIGHT);

        self.vote.set_inner(Vote {
            voter: self.voter.key(),
            project_id: self.project.key(),
            milestone_id: self.milestone.key(),
            decision,
            weight: final_voting_weight,
            bump: bumps.vote,
        });

        if decision {
            self.milestone.vote_for_weight =
                self.milestone.vote_for_weight
                    .saturating_add(final_voting_weight);
        } else {
            self.milestone.vote_against_weight =
                self.milestone.vote_against_weight
                    .saturating_add(final_voting_weight);
        }

        self.milestone.votes_casted = self.milestone.votes_casted.saturating_add(1);

        self.user.total_votes =
            self.user.total_votes.saturating_add(1);

        self.user.last_active_time = current_time;

        Ok(())
    }
}