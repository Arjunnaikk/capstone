use anchor_lang::prelude::*;
use crate::{errors::Error, state::{USER_SEED, User, milestone::*}};

#[derive(Clone, Debug, AnchorDeserialize, AnchorSerialize)]
pub struct CreateMilestoneArgs {
    pub milestone_type: MilestoneType,
    pub milestone_claim: u16,
    pub project_id: Pubkey,
}

#[derive(Accounts)]
#[instruction(args: CreateMilestoneArgs)]
pub struct CreateMilestone<'info> {
    #[account(mut)]
    pub milestone_authority: Signer<'info>,

    #[account(
        init,
        space = Milestone::DISCRIMINATOR.len() +  Milestone::INIT_SPACE,
        seeds= [MILESTONE_SEED, args.project_id.as_ref(), &[args.milestone_type as u8]],
        payer = milestone_authority,
        bump
    )]
    pub milestone: Account<'info, Milestone>,

    #[account(
        mut,
        seeds = [USER_SEED, milestone_authority.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateMilestone<'info> {
    pub fn create_milestone(&mut self, args: CreateMilestoneArgs) -> Result<()> {

        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        let deadline = current_time.checked_add(172_800).unwrap();
        
        self.milestone.set_inner(Milestone {
            project_id: args.project_id,
            milestone_claim: args.milestone_claim,
            attempt_number: 0,
            milestone_status: MilestoneState::Voting,
            milestone_type: args.milestone_type,
            milestone_deadline: deadline , 
            vote_against: 0,
            vote_for: 0,
            vote_against_weight: 0,
            vote_for_weight: 0, 
            bump: self.milestone.bump,
        });

        self.user.last_active_time = clock.unix_timestamp;
        self.user.milestones_posted = self.user.milestones_posted.checked_add(1).unwrap();

        Ok(())
    }
}
