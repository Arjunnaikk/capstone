use anchor_lang::prelude::*;

#[error_code]
pub enum Error {
    #[msg("Amount cannot be zero")]
    ZeroAmount,

     #[msg("Invalid milestone type provided.")]
    InvalidMilestoneType,

     #[msg("Fund amount cannot be zero.")]
    ZeroFund,

    #[msg("Project is not accepting funds")]
    ProjectNotFunding,

    #[msg("Numerical overflow")]
    Overflow,
}