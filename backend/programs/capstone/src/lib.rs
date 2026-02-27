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
    
    pub fn create_project(ctx: Context<CreateProject>, project_name: String, milestone_count: u8, target_amount: u64, deadline: i64) -> Result<()> {
        ctx.accounts.create_project(project_name, milestone_count, target_amount, deadline)?;
        Ok(())
    }

    pub fn create_milestone(ctx: Context<CreateMilestone>, args: CreateMilestoneArgs, task_id: u16) -> Result<()> {
        ctx.accounts.create_milestone(args, task_id, &ctx.bumps)?;
        Ok(())
    }

    pub fn contribute_fund(ctx: Context<ContributeFund>, amount: u64) -> Result<()> {
        ctx.accounts.contribute_fund(amount)?;
        Ok(())
    }

    pub fn vote_on_milestone(ctx: Context<VoteMilestone>, approve: bool) -> Result<()> {
        ctx.accounts.vote_milestone(approve)?;
        Ok(())
    }
    pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
        ctx.accounts.approve_milestone()?;
        Ok(())
    }

    pub fn retry_milestone(ctx: Context<RetryMilestone>, task_id: u16) -> Result<()> {
        ctx.accounts.retry_milestone(task_id, &ctx.bumps)?;
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        ctx.accounts.claim_refund()?;
        Ok(())
    }

}