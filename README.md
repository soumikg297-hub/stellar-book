# 🗳️ Soroban Voting DApp

## 📖 Project Description

This project is a decentralized voting smart contract built using **Soroban**, the smart contract platform on the Stellar network.

The goal of this DApp is to demonstrate how transparent, tamper-proof voting can be implemented on-chain where:
- Each wallet can vote only once per proposal
- All votes are stored on the blockchain
- Anyone can verify results publicly

This serves as a foundation for governance systems, DAOs, community voting, and public polling applications on Stellar.

---

## 🚀 What it does

The smart contract allows users to:

1. Create voting proposals
2. Vote for proposals using their Stellar address
3. Prevent double voting
4. Retrieve proposal results directly from the blockchain

All voting logic is enforced by the smart contract, removing the need for a trusted backend.

---

## ✨ Features

- ✅ On-chain proposal creation
- ✅ One vote per address per proposal
- ✅ Transparent vote counting
- ✅ Publicly verifiable results
- ✅ Built entirely with Soroban smart contracts
- ✅ Gas efficient storage design
- ✅ Easily extendable for real-world governance use cases

---

## 🧠 Smart Contract Functions

| Function | Description |
|---------|-------------|
| `create_proposal(title)` | Creates a new voting proposal |
| `vote(proposal_id, voter)` | Cast a vote (one per address) |
| `get_proposal(proposal_id)` | View proposal and vote count |
| `proposal_count()` | Get total proposals |
<img width="1912" height="897" alt="image" src="https://github.com/user-attachments/assets/053ad3d8-8fe9-46bb-a660-fa6375815941" />

---

## 🛠️ Tech Stack

- Rust
- Soroban SDK
- Stellar Testnet

---

## 🔗 Deployed Smart Contract Link

**XXX**

(Replace with your deployed contract ID after deployment)

---

## 🧪 Example Usage

Create proposal:

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- create_proposal --title "Upgrade Protocol"
