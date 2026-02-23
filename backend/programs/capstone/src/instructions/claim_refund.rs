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


impl<'info> ClaimRefund<'info> {
    pub fn claim_refund(&mut self) -> Result<()> {
        // 1️⃣ Ensure project failed
        require!(
            self.project.project_state == ProjectState::Failed,
            Error::ProjectNotFailed
        );

        // 2️⃣ Ensure contribution exists
        require!(
            self.contribution.amount > 0,
            Error::NoContribution
        );

        // 3️⃣ Prevent double refund
        require!(
            !self.contribution.refunded,
            Error::AlreadyRefunded
        );

        let refund_amount = self.contribution.amount;

        // 4️⃣ Mark refunded FIRST (reentrancy safe pattern)
        self.contribution.refunded = true;

        // 5️⃣ Transfer SOL from vault to funder
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

// funder, vault, contribution