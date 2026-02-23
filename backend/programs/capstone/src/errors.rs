use anchor_lang::prelude::*;

#[error_code]
pub enum Error {
    #[msg("Amount cannot be zero")]
    ZeroAmount,
    
    #[msg("Project is invalid")]
    InvalidProject,

    #[msg("Invalid milestone type provided.")]
    InvalidMilestoneType,

    #[msg("Fund amount cannot be zero.")]
    ZeroFund,

    #[msg("Project is not accepting funds")]
    ProjectNotFunding,

    #[msg("Project funding deadline has passed")]
    ProjectExpired,

    #[msg("Numerical overflow")]
    Overflow,

    #[msg("Numerical overflow")]
    NotVotingStage,

    #[msg("Project not in failed state")]
    ProjectNotFailed,

    #[msg("No contribution found")]
    NoContribution,

    #[msg("Refund already claimed")]
    AlreadyRefunded,
}