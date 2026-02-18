use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::state::{VAULT_SEED, Vault};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Vault::DISCRIMINATOR.len() + Vault::INIT_SPACE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mint::token_program = token_program,
    )]
    pub vault_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = vault_mint,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: InitializeBumps) -> Result<()> {
        self.vault.set_inner(Vault {
            authority: self.admin.key(),
            vault_mint: self.vault_mint.key(),
            vault_token_account: self.vault_token_account.key(),
            bump: bumps.vault,
        });

        Ok(())
    }
}