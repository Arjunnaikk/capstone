use anchor_lang::system_program::transfer;
use anchor_lang::{prelude::*, system_program::Transfer};
use crate::errors::Error::{self, *};    

use crate::state::{CONTRIBUTION_SEED, Contribution, PROJECT_SEED, Project, ProjectState, VAULT_SEED, Vault};

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


impl<'info> ClaimRefund<'info> {
    pub fn claim_refund(&mut self) -> Result<()> {
        require!(
            self.project.project_state == ProjectState::Failed,
            Error::ProjectNotFailed
        );

        require!(
            self.contribution.amount > 0,
            Error::NoContribution
        );

        require!(
            !self.contribution.refunded,
            Error::AlreadyRefunded
        );

        let refund_amount = self.contribution.amount;

        self.contribution.refunded = true;

        let signer_seeds: &[&[&[u8]]] = &[&[
            VAULT_SEED,
            &[self.vault.bump],
        ]];

        transfer(
            CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.vault.to_account_info(),
                    to: self.funder.to_account_info(),
                },
                signer_seeds,
            ),
            refund_amount,
        )?;

        Ok(())
    }
}
