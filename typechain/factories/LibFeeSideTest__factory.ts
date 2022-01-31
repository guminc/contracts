/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  LibFeeSideTest,
  LibFeeSideTestInterface,
} from "../LibFeeSideTest";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "maker",
        type: "bytes4",
      },
      {
        internalType: "bytes4",
        name: "taker",
        type: "bytes4",
      },
    ],
    name: "getFeeSideTest",
    outputs: [
      {
        internalType: "enum LibFeeSide.FeeSide",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101d8806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063aa0bab3514610030575b600080fd5b61004361003e36600461015c565b610059565b604051610050919061018e565b60405180910390f35b6000610065838361006e565b90505b92915050565b60006001600160e01b031983166355575f5d60e11b141561009157506001610068565b6001600160e01b031982166355575f5d60e11b14156100b257506002610068565b6001600160e01b031983166322ba176160e21b14156100d357506001610068565b6001600160e01b031982166322ba176160e21b14156100f457506002610068565b6001600160e01b0319831663025ceed960e61b141561011557506001610068565b6001600160e01b0319821663025ceed960e61b141561013657506002610068565b50600092915050565b80356001600160e01b03198116811461015757600080fd5b919050565b6000806040838503121561016e578182fd5b6101778361013f565b91506101856020840161013f565b90509250929050565b602081016003831061019c57fe5b9190529056fea2646970667358221220f9d5bef3b92502661fb344c9fbce72d7e535abad5eb6cecab6e172b8e38d2b9064736f6c63430007060033";

export class LibFeeSideTest__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<LibFeeSideTest> {
    return super.deploy(overrides || {}) as Promise<LibFeeSideTest>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): LibFeeSideTest {
    return super.attach(address) as LibFeeSideTest;
  }
  connect(signer: Signer): LibFeeSideTest__factory {
    return super.connect(signer) as LibFeeSideTest__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LibFeeSideTestInterface {
    return new utils.Interface(_abi) as LibFeeSideTestInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LibFeeSideTest {
    return new Contract(address, _abi, signerOrProvider) as LibFeeSideTest;
  }
}
