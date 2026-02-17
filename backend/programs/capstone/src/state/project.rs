use anchor_lang::prelude::*;

pub const PROJECT_SEED: &[u8] = b"PROJECT";

#[account]
#[derive(InitSpace)]
pub struct Project {
    pub project_authority: Pubkey,
    #[max_len(32)]
    pub target_amount: u64,
    pub collected_amount: u64,
    pub project_state: ProjectState,
    pub bump: u8,
}

#[derive(Clone, Copy, PartialEq, Eq, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub enum ProjectState {
    Funding,
    Development,
    Failed,
    Completed,
}