# GIBMONI - A Milestone-Based Crowdfunding Protocol

A decentralized crowdfunding platform built on Solana that ensures accountability through milestone-based fund releases and community voting mechanisms.

---

## Problem Statement


- **Lack of Accountability and Trust**: after raising funds, devs either abandon the project or scam the funders
- **No Community Governance**: funders have no say in whether project is adequately completed
- **All-or-Nothing Risk**: Current platforms don't provide mechanisms for partial refunds based on proportional delivery
---

## Proposal

we introduce a **milestone-based funding protocol** with built-in accountability mechanisms:

### Core Features:

1. **Milestone-Gated Fund Release**: Project funds are locked in a central vault and released incrementally only after each milestone is approved by the community
2. **Weighted Community Voting**: Contributors vote with voting power proportional to their contribution and reputation
3. **Automated Approval System**: Integration with Tuktuk crank-turner for automated milestone approval/rejection after voting periods
4. **Retry Mechanism**: Failed milestones can be retried up to 3 times, giving creators opportunity to improve
5. **Proportional Refunds**: If a project fails, contributors have access to pull-based refund mechanism
6. **Reputation System**: User accounts track contribution history, voting activity, and project success rates
---

## Workflow

### Phase 1: Project Creation & Funding
```
1. developer initializes user account → Creates project with:
   - Target funding amount
   - Number of milestones (1-5)
   - Project deadline
   - Project name

2. Project enters FUNDING state
3. Contributors fund the project (funds locked in vault)
4. Project transitions to DEVELOPMENT state when ready
```

### Phase 2: Milestone Execution
```
1. Creator posts milestone with:
   - Milestone type (Design/Development/Testing/Delivery/Upfront)
   - Payment claim amount (in basis points)

2. Tuktuk automation queues automatic approval task
3. Milestone enters VOTING state
4. Contributors vote on milestone completion:
   - Voting weight = contribution amount × reputation bonus
   - Vote approval or rejection
   
5. After voting period ends:
   - If approved: Funds released to creator, milestone marked complete
   - If rejected: Creator can retry (max 3 attempts)
   
6. Repeat for all milestones until project completes
```

### Phase 3: Project Completion or Failure
```
Success Path:
- All milestones approved → Project marked COMPLETED
- Creator reputation increases

Failure Path:
- Milestone rejected 3 times OR deadline passed
- Project marked FAILED
- Contributors can claim proportional refunds
```

---

## Instructions

### 1. **initialize**
Initializes the global vault account that holds all project funds. Must be called once by the protocol admin.

### 2. **initialize_user**
Creates a user account for tracking on-chain reputation, including donation history, voting activity, and project statistics. Required before creating projects or contributing.

### 3. **create_project**
Creates a new crowdfunding project with specified target amount, milestone count, deadline, and name. Project starts in FUNDING state.

### 4. **contribute_fund**
Allows users to contribute SOL to a project during the FUNDING phase. Creates or updates contribution record and increments project's collected amount and funder count.

### 5. **create_milestone**
Project creator posts a new milestone with type and payment claim percentage. Queues automated approval task via Tuktuk crank-turner and starts voting period.

### 6. **vote_on_milestone**
Contributors vote on milestone completion with weighted voting power based on contribution amount and reputation (max 3x bonus from reputation, capped at 5000x weight).

### 7. **approve_milestone**
Automated instruction (called by Tuktuk) that tallies votes after voting period ends, checks quorum requirements (30% of funders + 30% of capital), and either releases funds or marks milestone as rejected.

### 8. **retry_milestone**
Project creator can retry a rejected milestone (max 3 attempts). Resets voting state, queues new approval task, and opens new voting period.

### 9. **claim_refund**
Contributors can claim proportional refunds if a project enters FAILED state. Refund amount calculated based on contribution ratio and remaining vault funds.

---

## Tech Stack

### Automation & Task Scheduling
- **Helium-tuktuk SDK**: Helium's crank-turner for automated on-chain task execution

### Testing
- **TypeScript**: Type-safe client interactions
- **Mocha & Chai**: Testing framework for integration tests
- **ts-mocha**: TypeScript test runner

### Additional Libraries
- **Anchor SPL**: Solana Program Library integration
- **Axios**: HTTP client for API interaction
---



## Key Features & Mechanisms

### Voting Weight Formula
```
base_weight = contribution_amount × reputation_scaling
reputation_scaling = min(3, sqrt(reputation / 100))
final_weight = min(5000, base_weight)
```

### Quorum Requirements
- **Headcount**: 30% of total funders must vote
- **Capital**: 30% of total funds must be represented in votes
- **Approval**: Vote-for weight must exceed vote-against weight

### Milestone Attempt Limits
- Maximum 3 attempts per milestone
- After 3 rejections, project can be marked as FAILED

### Refund Calculation
```
refund = (contributor_amount / total_collected) × remaining_vault_funds
```

---

## License

ISC

---

## Program ID

**Devnet Public Key**: `AEmny7qcxz7vQHgVXTuRnrpHpAMKRsH3PNxD2fWftr3w`

---
