"use client";

import {
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CBAKUHQFXPPKLOTSBYNYMH43HZSMPFRVQHCJH422VFGV57JU5RMTVKOO";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}

function toScValAddress(value: string): xdr.ScVal {
  return new Address(value).toScVal();
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, sign and submit a Soroban contract call.
 */
async function callContract(
  method: string,
  params: xdr.ScVal[],
  caller: string
) {
  const contract = new (require("@stellar/stellar-sdk").Contract)(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  // Prepare the transaction with the simulation result
  const prepared = await rpc.assembleTransaction(tx, simulated).build();

  // Sign with Freighter
  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  // Poll for confirmation
  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
async function readContract(
  method: string,
  params: xdr.ScVal[]
) {
  const contract = new (require("@stellar/stellar-sdk").Contract)(CONTRACT_ADDRESS);
  // Use a random keypair for read-only
  const randomKeypair = Keypair.random();
  const account = await server.getAccount(randomKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (
    rpc.Api.isSimulationSuccess(simulated as rpc.Api.SimulateTransactionResponse) &&
    (simulated as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (simulated as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// Voting DApp — Contract Methods
// ============================================================

/**
 * Create a new proposal.
 * Calls: create_proposal(title: Symbol) -> u32
 */
export async function createProposal(caller: string, title: string) {
  return callContract(
    "create_proposal",
    [toScValString(title)],
    caller
  );
}

/**
 * Vote for a proposal.
 * Calls: vote(proposal_id: u32, voter: Address)
 */
export async function vote(caller: string, proposalId: number) {
  return callContract(
    "vote",
    [toScValU32(proposalId), toScValAddress(caller)],
    caller
  );
}

/**
 * Get proposal details (read-only).
 * Calls: get_proposal(proposal_id: u32) -> Proposal
 */
export async function getProposal(proposalId: number): Promise<{ id: number; title: string; votes: number } | null> {
  const result = await readContract("get_proposal", [toScValU32(proposalId)]);
  if (result && typeof result === "object") {
    return result as { id: number; title: string; votes: number };
  }
  return null;
}

/**
 * Get total number of proposals (read-only).
 * Calls: proposal_count() -> u32
 */
export async function getProposalCount(): Promise<number | null> {
  const result = await readContract("proposal_count", []);
  if (typeof result === "number") {
    return result;
  }
  return null;
}