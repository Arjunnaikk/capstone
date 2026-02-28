use crate::{
    errors::Error,
    state::{project::*, User, USER_SEED},
};
use anchor_lang::prelude::*;

#[derive(Clone, Debug, AnchorDeserialize, AnchorSerialize)]
pub struct CreateProjectArgs {
    pub project_name: String,
    pub milestone_count: u8,
    pub target_amount: u64,
    pub deadline: i64,
}

#[derive(Accounts)]
#[instruction(project_name: String)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub project_authority: Signer<'info>,

    #[account(
        init,
        payer = project_authority,
        space = Project::DISCRIMINATOR.len() +  Project::INIT_SPACE,
        seeds= [PROJECT_SEED, project_name.as_bytes(), project_authority.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [USER_SEED, project_authority.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateProject<'info> {
    pub fn create_project(
        &mut self,
        args: CreateProjectArgs,
        bumps: CreateProjectBumps,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(args.target_amount > 0, Error::ZeroAmount);

        require!(
            args.milestone_count <= 5 && args.milestone_count > 0,
            Error::InvalidMilestoneCount
        );

        self.project.set_inner(Project {
            project_authority: self.project_authority.key(),
            project_name: args.project_name,
            target_amount: args.target_amount,
            collected_amount: 0,
            withdrawn_amount: 0,
            project_state: ProjectState::Funding,
            milestones_posted: 0,
            milestone_count: args.milestone_count,
            milestones_completed: 0,
            project_deadline: args.deadline,
            funder_count: 0,
            bump: bumps.project,
        });

        self.user.projects_posted = self.user.projects_posted.checked_add(1).unwrap();
        self.user.last_active_time = clock.unix_timestamp;

        Ok(())
    }
}