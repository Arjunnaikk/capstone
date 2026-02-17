use anchor_lang::prelude::*;

use crate::{errors::Error, state::project::*};

#[derive(Accounts)]
#[instruction(project_name: String)]
pub struct InitializeProject<'info> {
    #[account(mut)]
    pub project_authority: Signer<'info>,

    #[account(
        init,
        payer = project_authority,
        space = Project::DISCRIMINATOR.len() +  Project::INIT_SPACE,
        seeds= [PROJECT_SEED, project_name.as_bytes(), project_authority.key().as_ref()],
        bump
    )]
    pub project: Box<Account<'info, Project>>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeProject<'info> {
    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        project_name: String,
        target_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        require!(target_amount > 0, Error::ZeroAmount);

        project.set_inner(Project {
            project_authority: ctx.accounts.project_authority.key(),
            project_name,
            target_amount: target_amount,
            collected_amount: 0,
            project_state: ProjectState::Funding,
            project_deadline: deadline,
            bump: ctx.bumps.project,
        });

        Ok(())
    }
}