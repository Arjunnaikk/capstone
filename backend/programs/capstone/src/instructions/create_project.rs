use anchor_lang::prelude::*;
use crate::{errors::Error, state::{USER_SEED, User, project::*}};

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
        project_name: String,
        target_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        
        let clock = Clock::get()?;
        require!(target_amount > 0, Error::ZeroAmount);

        self.project.set_inner(Project {
            project_authority: self.project_authority.key(),
            project_name,
            target_amount: target_amount,
            collected_amount: 0,
            withdrawn_amount:0,
            project_state: ProjectState::Funding,
            milestones_completed: 0, 
            project_deadline: deadline,
            funder_count: 0, 
            bump: self.project.bump,
        });

        self.user.projects_posted = self.user.projects_posted.checked_add(1).unwrap();
        self.user.last_active_time = clock.unix_timestamp;

        Ok(())
    }
}