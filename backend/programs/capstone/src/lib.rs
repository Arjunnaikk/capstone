use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;

use instructions::*;

declare_id!("3fk3PSD454iVm83yGsWtMo3xrwwV8MAUtSMhYPvimzTo");

#[program]
pub mod capstone {
    use super::*;

    
    pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
        ctx.accounts.approve_milestone()?;
        Ok(())
    }

}