use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;

use instructions::*;

declare_id!("3fk3PSD454iVm83yGsWtMo3xrwwV8MAUtSMhYPvimzTo");

#[program]
pub mod capstone {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps)?;
        Ok(())
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.init_user(ctx.bumps)?;
        Ok(())
    }
    
    pub fn create_project(ctx: Context<CreateProject>, args: CreateProjectArgs) -> Result<()> {
        ctx.accounts.create_project(args, ctx.bumps)?;
        Ok(())
    }

    pub fn create_milestone(ctx: Context<CreateMilestone>, args: CreateMilestoneArgs, task_id: u16) -> Result<()> {
        ctx.accounts.create_milestone(args, task_id, ctx.bumps)?;
        Ok(())
    }

    pub fn contribute_fund(ctx: Context<ContributeFund>, amount: u64) -> Result<()> {
        ctx.accounts.contribute_fund(amount, ctx.bumps)?;
        Ok(())
    }

    pub fn vote_on_milestone(ctx: Context<VoteMilestone>, approve: bool) -> Result<()> {
        ctx.accounts.vote_milestone(approve, ctx.bumps)?;
        Ok(())
    }
    pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
        ctx.accounts.approve_milestone()?;
        Ok(())
    }

    pub fn retry_milestone(ctx: Context<RetryMilestone>, task_id: u16) -> Result<()> {
        ctx.accounts.retry_milestone(task_id, ctx.bumps)?;
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        ctx.accounts.claim_refund()?;
        Ok(())
    }
}