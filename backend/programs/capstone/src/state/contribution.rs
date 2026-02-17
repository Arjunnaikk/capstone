use anchor_lang::prelude::*;

pub const CONTRIBUTION_SEED: &[u8] = b"contribution";

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub funder: Pubkey,
    pub project: Pubkey,
    pub amount: u64,
    pub bump: u8,
    
}

#[derive(Clone, Copy, PartialEq, Eq, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub enum ProjectState {
    Funding,
    Development,
    Failed,
    Completed,
}