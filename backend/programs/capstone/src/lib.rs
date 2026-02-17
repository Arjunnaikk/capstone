use anchor_lang::prelude::*;

mod instructions;
mod state;
mod errors;

use instructions::*;

declare_id!("3fk3PSD454iVm83yGsWtMo3xrwwV8MAUtSMhYPvimzTo");

#[program]
pub mod capstone {
    use super::*;

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        project_name: String,
        target_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        InitializeProject::initialize_project(ctx, project_name, target_amount, deadline)
    }
    
    pub fn contribute_funds(ctx: Context<ContributeFunds>, amount: u64) -> Result<()> {
        ContributeFunds::contribute_funds(ctx, amount)
    }

}