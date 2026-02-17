use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub seed: u64,               
    pub authority: Option<Pubkey>, 
    pub fee: u16,                  
    pub config_bump: u8,         
    pub lp_bump: u8,              
}