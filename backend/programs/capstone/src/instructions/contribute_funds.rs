use anchor_lang::prelude::*;
use anchor_lang::system_program::*;
use crate::{state::*, errors::Error};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct ContributeFunds<'info> {

    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_authority.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, Project>,

    #[account(
        init,
        payer = funder,
        space = 8 + Contribution::INIT_SPACE,
        seeds = [
            CONTRIBUTION_SEED,
            project.key().as_ref(),
            funder.key().as_ref()
        ],
        bump
    )]
    pub contribution: Account<'info, Contribution>,
    pub system_program: Program<'info, System>,
}

impl<'info> ContributeFunds<'info> {
    pub fn contribute_funds(ctx: Context<ContributeFunds>, amount: u64) -> Result<()> {
        let project = &mut ctx.accounts.project;
    let contribution = &mut ctx.accounts.contribution;
    let funder = &ctx.accounts.funder;

    //Check project is in funding state
    require!(
        project.project_state == ProjectState::Funding,
        Error::ProjectNotFunding
    );

    //Check deadline not passed
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time <= project.project_deadline,
        Error::ProjectExpired
    );

    //Initialize contribution if first time
    if contribution.amount == 0 {
        contribution.funder = funder.key();
        contribution.project = project.key();
        contribution.bump = ctx.bumps.contribution;
    }

    //Increase contribution amount
    contribution.amount = contribution
        .amount
        .checked_add(amount)
        .ok_or(Error::Overflow)?;

    //Transfer SOL from funder → project PDA
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: funder.to_account_info(),
            to: project.to_account_info(),
        },
    );

    transfer(cpi_ctx, amount)?;

    //Update collected amount
    project.collected_amount = project
        .collected_amount
        .checked_add(amount)
        .ok_or(Error::Overflow)?;

        Ok(())
    }
}