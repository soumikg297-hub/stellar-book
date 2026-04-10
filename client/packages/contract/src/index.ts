import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBAKUHQFXPPKLOTSBYNYMH43HZSMPFRVQHCJH422VFGV57JU5RMTVKOO",
  }
} as const

export type DataKey = {tag: "Proposal", values: readonly [u32]} | {tag: "Voted", values: readonly [u32, string]} | {tag: "ProposalCount", values: void};


export interface Proposal {
  id: u32;
  title: string;
  votes: u32;
}

export interface Client {
  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vote: ({proposal_id, voter}: {proposal_id: u32, voter: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_proposal: ({proposal_id}: {proposal_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Proposal>>

  /**
   * Construct and simulate a proposal_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  proposal_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a create_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_proposal: ({title}: {title: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAAAAAAAACFByb3Bvc2FsAAAAAQAAAAQAAAABAAAAAAAAAAVWb3RlZAAAAAAAAAIAAAAEAAAAEwAAAAAAAAAAAAAADVByb3Bvc2FsQ291bnQAAAA=",
        "AAAAAQAAAAAAAAAAAAAACFByb3Bvc2FsAAAAAwAAAAAAAAACaWQAAAAAAAQAAAAAAAAABXRpdGxlAAAAAAAAEQAAAAAAAAAFdm90ZXMAAAAAAAAE",
        "AAAAAAAAAAAAAAAEdm90ZQAAAAIAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAMZ2V0X3Byb3Bvc2FsAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAfQAAAACFByb3Bvc2Fs",
        "AAAAAAAAAAAAAAAOcHJvcG9zYWxfY291bnQAAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAAPY3JlYXRlX3Byb3Bvc2FsAAAAAAEAAAAAAAAABXRpdGxlAAAAAAAAEQAAAAEAAAAE" ]),
      options
    )
  }
  public readonly fromJSON = {
    vote: this.txFromJSON<null>,
        get_proposal: this.txFromJSON<Proposal>,
        proposal_count: this.txFromJSON<u32>,
        create_proposal: this.txFromJSON<u32>
  }
}