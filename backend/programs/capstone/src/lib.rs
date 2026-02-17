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
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
