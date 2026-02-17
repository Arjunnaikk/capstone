use anchor_lang::prelude::*;

use crate::{errors::Error, state::project::*};

pub fn initialize_project(
    ctx: Context<InitializeProject>,
    project_id: String,
    target_amount: u64,
    deadline: i64,
) -> Result<()> {
    let project = &mut ctx.accounts.project;

    require!(target_amount > 0, Error::ZeroAmount);

    project.set_inner(Project {
        project_authority: ctx.accounts.project_authority.key(),
        target_amount: target_amount,
        collected_amount: 0,
        project_state: ProjectState::Funding,
        bump: ctx.bumps.project,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(project_id: String)]
pub struct InitializeProject<'info> {
    #[account(mut)]
    pub project_authority: Signer<'info>,

    #[account(
        init,
        space = Project::DISCRIMINATOR.len() +  Project::INIT_SPACE,
        seeds= [PROJECT_SEED, project_id.as_bytes(), project_authority.key().as_ref()],
        payer = project_authority,
        bump
    )]
    pub project: Box<Account<'info, Project>>,

    pub system_program: Program<'info, System>,
}