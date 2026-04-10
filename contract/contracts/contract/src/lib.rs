#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u32,
    pub title: Symbol,
    pub votes: u32,
}

#[contracttype]
pub enum DataKey {
    Proposal(u32),
    Voted(u32, Address),
    ProposalCount,
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    // Create a new proposal
    pub fn create_proposal(env: Env, title: Symbol) -> u32 {
        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);

        count += 1;

        let proposal = Proposal {
            id: count,
            title,
            votes: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::Proposal(count), &proposal);

        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &count);

        count
    }

    // Vote for a proposal (one vote per address)
    pub fn vote(env: Env, proposal_id: u32, voter: Address) {
        voter.require_auth();

        // Check if already voted
        if env
            .storage()
            .instance()
            .has(&DataKey::Voted(proposal_id, voter.clone()))
        {
            panic!("Already voted for this proposal");
        }

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("Proposal does not exist");

        proposal.votes += 1;

        env.storage()
            .instance()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        env.storage()
            .instance()
            .set(&DataKey::Voted(proposal_id, voter), &true);
    }

    // Get proposal details
    pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal {
        env.storage()
            .instance()
            .get(&DataKey::Proposal(proposal_id))
            .expect("Proposal not found")
    }

    // Get total number of proposals
    pub fn proposal_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0)
    }
}