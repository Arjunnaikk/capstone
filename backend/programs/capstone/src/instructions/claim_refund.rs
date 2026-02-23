use anchor_lang::prelude::*;

use crate::state::{CONTRIBUTION_SEED, Contribution, PROJECT_SEED, Project, USER_SEED, User, VAULT_SEED, Vault};

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            PROJECT_SEED,
            project.project_name.as_bytes(),
            project.project_authority.as_ref()
        ],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [
            CONTRIBUTION_SEED,
            funder.key().as_ref(),
            project.key().as_ref()
        ],
        bump = contribution.bump,
        has_one = funder,
        has_one = project,
    )]
    pub contribution: Account<'info, Contribution>,

    pub system_program: Program<'info, System>,
}


// funder, vault, contribution