/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { LibOrderTest, LibOrderTestInterface } from "../LibOrderTest";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "makeAsset",
            type: "tuple",
          },
          {
            internalType: "address",
            name: "taker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "takeAsset",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "bytes4",
            name: "dataType",
            type: "bytes4",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct LibOrder.Order",
        name: "order",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "fill",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isMakeFill",
        type: "bool",
      },
    ],
    name: "calculateRemaining",
    outputs: [
      {
        internalType: "uint256",
        name: "makeAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "takeAmount",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "makeAsset",
            type: "tuple",
          },
          {
            internalType: "address",
            name: "taker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "takeAsset",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "bytes4",
            name: "dataType",
            type: "bytes4",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct LibOrder.Order",
        name: "order",
        type: "tuple",
      },
    ],
    name: "hashKey",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes4",
                name: "assetClass",
                type: "bytes4",
              },
              {
                internalType: "bytes",
                name: "data",
                type: "bytes",
              },
            ],
            internalType: "struct LibAsset.AssetType",
            name: "assetType",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct LibAsset.Asset",
        name: "makeAsset",
        type: "tuple",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes4",
                name: "assetClass",
                type: "bytes4",
              },
              {
                internalType: "bytes",
                name: "data",
                type: "bytes",
              },
            ],
            internalType: "struct LibAsset.AssetType",
            name: "assetType",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct LibAsset.Asset",
        name: "takeAsset",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "hashV1",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes4",
                name: "assetClass",
                type: "bytes4",
              },
              {
                internalType: "bytes",
                name: "data",
                type: "bytes",
              },
            ],
            internalType: "struct LibAsset.AssetType",
            name: "assetType",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct LibAsset.Asset",
        name: "makeAsset",
        type: "tuple",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes4",
                name: "assetClass",
                type: "bytes4",
              },
              {
                internalType: "bytes",
                name: "data",
                type: "bytes",
              },
            ],
            internalType: "struct LibAsset.AssetType",
            name: "assetType",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct LibAsset.Asset",
        name: "takeAsset",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "hashV2",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "makeAsset",
            type: "tuple",
          },
          {
            internalType: "address",
            name: "taker",
            type: "address",
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes4",
                    name: "assetClass",
                    type: "bytes4",
                  },
                  {
                    internalType: "bytes",
                    name: "data",
                    type: "bytes",
                  },
                ],
                internalType: "struct LibAsset.AssetType",
                name: "assetType",
                type: "tuple",
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256",
              },
            ],
            internalType: "struct LibAsset.Asset",
            name: "takeAsset",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "salt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "bytes4",
            name: "dataType",
            type: "bytes4",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct LibOrder.Order",
        name: "order",
        type: "tuple",
      },
    ],
    name: "validate",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610c2a806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c8063058dbeef1461005c57806327c4ea4714610085578063475f4e4e146100985780634fa8d605146100b957806387774dd9146100cc575b600080fd5b61006f61006a366004610981565b6100e1565b60405161007c9190610aaf565b60405180910390f35b61006f610093366004610869565b6100fc565b6100ab6100a63660046109b4565b61014b565b60405161007c929190610ab8565b61006f6100c73660046108e2565b61016e565b6100df6100da366004610981565b6101c0565b005b60006100f46100ef83610aea565b6101d4565b90505b919050565b60008461010c8560000151610343565b845161011790610343565b8460405160200161012b9493929190610a11565b604051602081830303815290604052805190602001209050949350505050565b60008061016161015a86610aea565b85856103ad565b915091505b935093915050565b60008561017e8660000151610343565b855161018990610343565b858560405160200161019f959493929190610a37565b60405160208183030381529060405280519060200120905095945050505050565b6101d16101cc82610aea565b610426565b50565b60e08101516000906001600160e01b0319166323d235ef60e01b14156102d357815160208301515161020590610343565b60608401515161021490610343565b846080015185610100015160405160200180866001600160a01b0316815260200185815260200184815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015610280578181015183820152602001610268565b50505050905090810190601f1680156102ad5780820380516001836020036101000a031916815260200191505b5096505050505050506040516020818303038152906040528051906020012090506100f7565b81516020830151516102e490610343565b6060840151516102f390610343565b846080015160405160200180856001600160a01b031681526020018481526020018381526020018281526020019450505050506040516020818303038152906040528051906020012090506100f7565b8051602091820151805190830120604080517f452a0dc408cb0d27ffc3b3caff933a5208040a53a9dbecd8d89cad2c0d40e00c818601526001600160e01b031990931683820152606080840192909252805180840390920182526080909201909152805191012090565b60008082156103ec5760208086015101516103c890856104f0565b91506103e585606001516020015186602001516020015184610552565b9050610166565b6060850151602001516103ff90856104f0565b905061041c85602001516020015186606001516020015183610552565b9150935093915050565b60a0810151158061043a5750428160a00151105b61048b576040805162461bcd60e51b815260206004820152601d60248201527f4f726465722073746172742076616c69646174696f6e206661696c6564000000604482015290519081900360640190fd5b60c0810151158061049f5750428160c00151115b6101d1576040805162461bcd60e51b815260206004820152601b60248201527f4f7264657220656e642076616c69646174696f6e206661696c65640000000000604482015290519081900360640190fd5b600082821115610547576040805162461bcd60e51b815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b508082035b92915050565b600061055f8484846105be565b156105a2576040805162461bcd60e51b815260206004820152600e60248201526d3937bab73234b7339032b93937b960911b604482015290519081900360640190fd5b6105b6836105b0868561064f565b906106a8565b949350505050565b600082610605576040805162461bcd60e51b815260206004820152601060248201526f6469766973696f6e206279207a65726f60801b604482015290519081900360640190fd5b811580610610575083155b1561061d57506000610648565b6000838061062757fe5b8584099050610636858461064f565b610642826103e861064f565b10159150505b9392505050565b60008261065e5750600061054c565b8282028284828161066b57fe5b04146106485760405162461bcd60e51b8152600401808060200182810382526021815260200180610bd46021913960400191505060405180910390fd5b60008082116106fe576040805162461bcd60e51b815260206004820152601a60248201527f536166654d6174683a206469766973696f6e206279207a65726f000000000000604482015290519081900360640190fd5b81838161070757fe5b049392505050565b80356001600160a01b03811681146100f757600080fd5b80356001600160e01b0319811681146100f757600080fd5b600082601f83011261074e578081fd5b813567ffffffffffffffff81111561076257fe5b610775601f8201601f1916602001610ac6565b818152846020838601011115610789578283fd5b816020850160208301379081016020019190915292915050565b600060408083850312156107b5578182fd5b805181810167ffffffffffffffff82821081831117156107d157fe5b8184528294508535818111156107e657600080fd5b86018088038513156107f757600080fd5b60808401838110838211171561080957fe5b855261081481610726565b8352602081013594508185111561082a57600080fd5b6108368886830161073e565b60608501525050815260209384013593019290925292915050565b60006101208284031215610863578081fd5b50919050565b6000806000806080858703121561087e578384fd5b6108878561070f565b9350602085013567ffffffffffffffff808211156108a3578485fd5b6108af888389016107a3565b945060408701359150808211156108c4578384fd5b506108d1878288016107a3565b949793965093946060013593505050565b600080600080600060a086880312156108f9578081fd5b6109028661070f565b9450602086013567ffffffffffffffff8082111561091e578283fd5b61092a89838a016107a3565b9550604088013591508082111561093f578283fd5b61094b89838a016107a3565b9450606088013593506080880135915080821115610967578283fd5b506109748882890161073e565b9150509295509295909350565b600060208284031215610992578081fd5b813567ffffffffffffffff8111156109a8578182fd5b6105b684828501610851565b6000806000606084860312156109c8578283fd5b833567ffffffffffffffff8111156109de578384fd5b6109ea86828701610851565b9350506020840135915060408401358015158114610a06578182fd5b809150509250925092565b6001600160a01b0394909416845260208401929092526040830152606082015260800190565b600060018060a01b03871682526020868184015285604084015284606084015260a0608084015283518060a0850152825b81811015610a845785810183015185820160c001528201610a68565b81811115610a95578360c083870101525b50601f01601f19169290920160c001979650505050505050565b90815260200190565b918252602082015260400190565b60405181810167ffffffffffffffff81118282101715610ae257fe5b604052919050565b6000610120808336031215610afd578182fd5b610b0681610ac6565b9050610b118361070f565b8152602083013567ffffffffffffffff80821115610b2d578384fd5b610b39368387016107a3565b6020840152610b4a6040860161070f565b60408401526060850135915080821115610b62578384fd5b610b6e368387016107a3565b60608401526080850135608084015260a085013560a084015260c085013560c0840152610b9d60e08601610726565b60e084015261010091508185013581811115610bb7578485fd5b610bc33682880161073e565b838501525050508091505091905056fe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a2646970667358221220cdea1a6da344df9f188b49a0d2bf9f08ce70fa14bd359aca7280b328f5bcdf0164736f6c63430007060033";

export class LibOrderTest__factory extends ContractFactory {
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
  ): Promise<LibOrderTest> {
    return super.deploy(overrides || {}) as Promise<LibOrderTest>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): LibOrderTest {
    return super.attach(address) as LibOrderTest;
  }
  connect(signer: Signer): LibOrderTest__factory {
    return super.connect(signer) as LibOrderTest__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LibOrderTestInterface {
    return new utils.Interface(_abi) as LibOrderTestInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LibOrderTest {
    return new Contract(address, _abi, signerOrProvider) as LibOrderTest;
  }
}
