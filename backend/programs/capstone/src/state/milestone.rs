use anchor_lang::prelude::*;


pub const MILESTONE_SEED: &[u8] = b"PROJECT_MILESTONE";

#[account]
#[derive(InitSpace)]
pub struct Milestone{
    pub project_id: Pubkey,
    pub milestone_claim: u16,
    pub attempt_number: u8,
    pub milestone_status: MilestoneState,
    pub milestone_type: MilestoneType,
    pub vote_against: u8,
    pub vote_for: u8,
    pub bump: u8
}

#[derive(Clone, InitSpace, AnchorSerialize, AnchorDeserialize, Debug)]
pub enum MilestoneState{
    Created,
    Voting,
    Approved, 
    Disapproved
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