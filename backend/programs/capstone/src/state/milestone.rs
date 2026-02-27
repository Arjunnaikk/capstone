use anchor_lang::prelude::*;

pub const MILESTONE_SEED: &[u8] = b"PROJECT_MILESTONE";

#[account]
#[derive(InitSpace, Debug)]
pub struct Milestone{
    pub project_id: Pubkey,
    pub milestone_claim: u16,
    pub attempt_number: u8,
    pub milestone_status: MilestoneState,
    pub milestone_type: MilestoneType,
    pub votes_casted: u32,
    pub amount_voted: u64,
    pub vote_against_weight: u64, 
    pub vote_for_weight: u64, 
    pub bump: u8
}

#[derive(Clone, Copy, PartialEq, Eq, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
pub enum MilestoneState {
    Voting,
    Approved,
    Disapproved,
}

#[derive(Clone, Copy, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
#[repr(u8)]
pub enum MilestoneType{
    Design,
    Development,
    Testing, 
    Delivery,
    Upfront
}