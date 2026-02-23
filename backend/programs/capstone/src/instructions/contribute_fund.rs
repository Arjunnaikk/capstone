use crate::{errors::Error, state::*};
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to_checked, Mint, MintToChecked,
        TokenAccount, TokenInterface,
    },
};

#[derive(Accounts)]
pub struct ContributeFund<'info> {
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
        seeds = [PROJECT_SEED,project.project_name.as_bytes(), project.project_authority.as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [USER_SEED, funder.key().as_ref()],
        bump = user.bump
    )]
    pub user: Account<'info, User>,

     #[account(
        init,
        payer = funder,
        space = Project::DISCRIMINATOR.len() +  Project::INIT_SPACE,
        seeds= [CONTRIBUTION_SEED,  funder.key().as_ref(), project.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(
        init_if_needed,
        payer = funder,
        associated_token::mint = vault_mint,
        associated_token::authority = funder,
        associated_token::token_program = token_program
    )]
    pub funder_receipt_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_mint.mint_authority == 
            anchor_lang::solana_program::program_option::COption::Some(vault.key())
    )]
    pub vault_mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> ContributeFund<'info> {
    pub fn contribute_fund(&mut self, amount: u64) -> Result<()> {
        require!(amount > 0, Error::ZeroAmount);

        require!(
            self.project.project_state == ProjectState::Funding,
            Error::ProjectNotFunding
        );

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp <= self.project.project_deadline,
            Error::ProjectNotFunding
        );

        transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                Transfer {
                    from: self.funder.to_account_info(),
                    to: self.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            VAULT_SEED,
            &[self.vault.bump],
        ]];

        mint_to_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintToChecked {
                    mint: self.vault_mint.to_account_info(),
                    to: self.funder_receipt_ata.to_account_info(),
                    authority: self.vault.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            self.vault_mint.decimals,
        )?;

        self.contribution.set_inner(Contribution { 
            funder: self.funder.key(), 
            project:self.project.key(), 
            amount, 
            refunded: false,
            bump: self.contribution.bump });

        self.project.collected_amount = self.project.collected_amount.checked_add(amount).unwrap();
        self.project.funder_count = self.project.funder_count.checked_add(1).unwrap();

        if self.project.collected_amount >= self.project.target_amount {
            self.project.project_state = ProjectState::Development;
        }

        self.user.donated_amount = self.user.donated_amount.checked_add(amount).unwrap();
        self.user.last_active_time = clock.unix_timestamp;

        Ok(())
    }
}