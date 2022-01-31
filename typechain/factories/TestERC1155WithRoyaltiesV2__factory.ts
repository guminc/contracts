/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  TestERC1155WithRoyaltiesV2,
  TestERC1155WithRoyaltiesV2Interface,
} from "../TestERC1155WithRoyaltiesV2";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address payable",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "value",
            type: "uint96",
          },
        ],
        indexed: false,
        internalType: "struct LibPart.Part[]",
        name: "royalties",
        type: "tuple[]",
      },
    ],
    name: "RoyaltiesSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getRaribleV2Royalties",
    outputs: [
      {
        components: [
          {
            internalType: "address payable",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "value",
            type: "uint96",
          },
        ],
        internalType: "struct LibPart.Part[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address payable",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "value",
            type: "uint96",
          },
        ],
        internalType: "struct LibPart.Part[]",
        name: "_fees",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611d25806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a85760003560e01c80634e1273f4116100715780634e1273f41461013e5780638129fc1c1461015e578063a22cb46514610166578063cad96cca14610179578063e985e9c514610199578063f242432a146101ac576100a8565b8062fdd58e146100ad57806301ffc9a7146100d65780630e89341c146100f65780632eb2c2d614610116578063310c787f1461012b575b600080fd5b6100c06100bb366004611668565b6101bf565b6040516100cd91906119a4565b60405180910390f35b6100e96100e4366004611858565b61022e565b6040516100cd9190611946565b610109610104366004611880565b61024d565b6040516100cd9190611951565b610129610124366004611526565b6102e5565b005b610129610139366004611693565b6105e3565b61015161014c366004611798565b61060e565b6040516100cd9190611902565b6101296106fa565b610129610174366004611637565b6107ab565b61018c610187366004611880565b61089a565b6040516100cd91906118ef565b6100e96101a73660046114ee565b610920565b6101296101ba3660046115d0565b61094e565b60006001600160a01b0383166102065760405162461bcd60e51b815260040180806020018281038252602b815260200180611b2d602b913960400191505060405180910390fd5b5060009081526066602090815260408083206001600160a01b03949094168352929052205490565b6001600160e01b03191660009081526034602052604090205460ff1690565b60688054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156102d95780601f106102ae576101008083540402835291602001916102d9565b820191906000526020600020905b8154815290600101906020018083116102bc57829003601f168201915b50505050509050919050565b81518351146103255760405162461bcd60e51b8152600401808060200182810382526028815260200180611ca76028913960400191505060405180910390fd5b6001600160a01b03841661036a5760405162461bcd60e51b8152600401808060200182810382526025815260200180611b816025913960400191505060405180910390fd5b610372610b19565b6001600160a01b0316856001600160a01b031614806103985750610398856101a7610b19565b6103d35760405162461bcd60e51b8152600401808060200182810382526032815260200180611ba66032913960400191505060405180910390fd5b60006103dd610b19565b90506103ed8187878787876105db565b60005b84518110156104f357600085828151811061040757fe5b60200260200101519050600085838151811061041f57fe5b6020026020010151905061048c816040518060600160405280602a8152602001611c06602a91396066600086815260200190815260200160002060008d6001600160a01b03166001600160a01b0316815260200190815260200160002054610b1e9092919063ffffffff16565b60008381526066602090815260408083206001600160a01b038e811685529252808320939093558a16815220546104c39082610bb5565b60009283526066602090815260408085206001600160a01b038c16865290915290922091909155506001016103f0565b50846001600160a01b0316866001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb8787604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b83811015610579578181015183820152602001610561565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156105b85781810151838201526020016105a0565b5050505090500194505050505060405180910390a46105db818787878787610c16565b505050505050565b6105fe84848360405180602001604052806000815250610e95565b6106088383610f9d565b50505050565b606081518351146106505760405162461bcd60e51b8152600401808060200182810382526029815260200180611c7e6029913960400191505060405180910390fd5b6000835167ffffffffffffffff8111801561066a57600080fd5b50604051908082528060200260200182016040528015610694578160200160208202803683370190505b50905060005b84518110156106f2576106d38582815181106106b257fe5b60200260200101518583815181106106c657fe5b60200260200101516101bf565b8282815181106106df57fe5b602090810291909101015260010161069a565b509392505050565b600154610100900460ff1680610713575061071361118f565b80610721575060015460ff16155b61075c5760405162461bcd60e51b815260040180806020018281038252602e815260200180611bd8602e913960400191505060405180910390fd5b600154610100900460ff16158015610786576001805460ff1961ff00199091166101001716811790555b61079663656cb66560e11b6111a0565b80156107a8576001805461ff00191690555b50565b816001600160a01b03166107bd610b19565b6001600160a01b031614156108035760405162461bcd60e51b8152600401808060200182810382526029815260200180611c556029913960400191505060405180910390fd5b8060676000610810610b19565b6001600160a01b03908116825260208083019390935260409182016000908120918716808252919093529120805460ff191692151592909217909155610854610b19565b6001600160a01b03167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b600081815260208181526040808320805482518185028101850190935280835260609492939192909184015b8282101561091557600084815260209081902060408051808201909152908401546001600160a01b0381168252600160a01b90046001600160601b0316818301528252600190920191016108c6565b505050509050919050565b6001600160a01b03918216600090815260676020908152604080832093909416825291909152205460ff1690565b6001600160a01b0384166109935760405162461bcd60e51b8152600401808060200182810382526025815260200180611b816025913960400191505060405180910390fd5b61099b610b19565b6001600160a01b0316856001600160a01b031614806109c157506109c1856101a7610b19565b6109fc5760405162461bcd60e51b8152600401808060200182810382526029815260200180611b586029913960400191505060405180910390fd5b6000610a06610b19565b9050610a26818787610a1788611224565b610a2088611224565b876105db565b610a6d836040518060600160405280602a8152602001611c06602a913960008781526066602090815260408083206001600160a01b038d1684529091529020549190610b1e565b60008581526066602090815260408083206001600160a01b038b81168552925280832093909355871681522054610aa49084610bb5565b60008581526066602090815260408083206001600160a01b03808b168086529184529382902094909455805188815291820187905280518a8416938616927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f6292908290030190a46105db818787878787611269565b335b90565b60008184841115610bad5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610b72578181015183820152602001610b5a565b50505050905090810190601f168015610b9f5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b600082820183811015610c0f576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b610c28846001600160a01b03166113da565b156105db57836001600160a01b031663bc197c8187878686866040518663ffffffff1660e01b815260040180866001600160a01b03168152602001856001600160a01b03168152602001806020018060200180602001848103845287818151815260200191508051906020019060200280838360005b83811015610cb6578181015183820152602001610c9e565b50505050905001848103835286818151815260200191508051906020019060200280838360005b83811015610cf5578181015183820152602001610cdd565b50505050905001848103825285818151815260200191508051906020019080838360005b83811015610d31578181015183820152602001610d19565b50505050905090810190601f168015610d5e5780820380516001836020036101000a031916815260200191505b5098505050505050505050602060405180830381600087803b158015610d8357600080fd5b505af1925050508015610da857506040513d6020811015610da357600080fd5b505160015b610e3d57610db4611a16565b80610dbf5750610e06565b60405162461bcd60e51b8152602060048201818152835160248401528351849391928392604401919085019080838360008315610b72578181015183820152602001610b5a565b60405162461bcd60e51b8152600401808060200182810382526034815260200180611ad16034913960400191505060405180910390fd5b6001600160e01b0319811663bc197c8160e01b14610e8c5760405162461bcd60e51b8152600401808060200182810382526028815260200180611b056028913960400191505060405180910390fd5b50505050505050565b6001600160a01b038416610eda5760405162461bcd60e51b8152600401808060200182810382526021815260200180611ccf6021913960400191505060405180910390fd5b6000610ee4610b19565b9050610ef681600087610a1788611224565b60008481526066602090815260408083206001600160a01b0389168452909152902054610f239084610bb5565b60008581526066602090815260408083206001600160a01b03808b16808652918452828520959095558151898152928301889052815190948616927fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f6292908290030190a4610f9681600087878787611269565b5050505050565b6000805b825181101561113f5760006001600160a01b0316838281518110610fc157fe5b6020026020010151600001516001600160a01b03161415611029576040805162461bcd60e51b815260206004820152601b60248201527f526563697069656e742073686f756c642062652070726573656e740000000000604482015290519081900360640190fd5b82818151811061103557fe5b6020026020010151602001516001600160601b03166000141561109f576040805162461bcd60e51b815260206004820181905260248201527f526f79616c74792076616c75652073686f756c6420626520706f736974697665604482015290519081900360640190fd5b8281815181106110ab57fe5b6020026020010151602001516001600160601b0316820191506000808581526020019081526020016000208382815181106110e257fe5b60209081029190910181015182546001818101855560009485529383902082519101805492909301516001600160601b0316600160a01b026001600160a01b039182166001600160a01b0319909316929092171617905501610fa1565b5061271081106111805760405162461bcd60e51b8152600401808060200182810382526025815260200180611c306025913960400191505060405180910390fd5b61118a83836113e0565b505050565b600061119a306113da565b15905090565b6001600160e01b031980821614156111ff576040805162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e7465726661636520696400000000604482015290519081900360640190fd5b6001600160e01b0319166000908152603460205260409020805460ff19166001179055565b6040805160018082528183019092526060916000919060208083019080368337019050509050828160008151811061125857fe5b602090810291909101015292915050565b61127b846001600160a01b03166113da565b156105db57836001600160a01b031663f23a6e6187878686866040518663ffffffff1660e01b815260040180866001600160a01b03168152602001856001600160a01b0316815260200184815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b8381101561130a5781810151838201526020016112f2565b50505050905090810190601f1680156113375780820380516001836020036101000a031916815260200191505b509650505050505050602060405180830381600087803b15801561135a57600080fd5b505af192505050801561137f57506040513d602081101561137a57600080fd5b505160015b61138b57610db4611a16565b6001600160e01b0319811663f23a6e6160e01b14610e8c5760405162461bcd60e51b8152600401808060200182810382526028815260200180611b056028913960400191505060405180910390fd5b3b151590565b7f3fa96d7b6bcbfe71ef171666d84db3cf52fa2d1c8afdb1cc8e486177f208b7df82826040516114119291906119ad565b60405180910390a15050565b600082601f83011261142d578081fd5b8135602061144261143d836119f2565b6119ce565b828152818101908583018385028701840188101561145e578586fd5b855b8581101561147c57813584529284019290840190600101611460565b5090979650505050505050565b600082601f830112611499578081fd5b813567ffffffffffffffff8111156114ad57fe5b6114c0601f8201601f19166020016119ce565b8181528460208386010111156114d4578283fd5b816020850160208301379081016020019190915292915050565b60008060408385031215611500578182fd5b823561150b81611abb565b9150602083013561151b81611abb565b809150509250929050565b600080600080600060a0868803121561153d578081fd5b853561154881611abb565b9450602086013561155881611abb565b9350604086013567ffffffffffffffff80821115611574578283fd5b61158089838a0161141d565b94506060880135915080821115611595578283fd5b6115a189838a0161141d565b935060808801359150808211156115b6578283fd5b506115c388828901611489565b9150509295509295909350565b600080600080600060a086880312156115e7578081fd5b85356115f281611abb565b9450602086013561160281611abb565b93506040860135925060608601359150608086013567ffffffffffffffff81111561162b578182fd5b6115c388828901611489565b60008060408385031215611649578182fd5b823561165481611abb565b91506020830135801515811461151b578182fd5b6000806040838503121561167a578182fd5b823561168581611abb565b946020939093013593505050565b600080600080608085870312156116a8578081fd5b84356116b381611abb565b9350602085810135935060408087013567ffffffffffffffff808211156116d8578485fd5b818901915089601f8301126116eb578485fd5b81356116f961143d826119f2565b81815285810190848701868402860188018e1015611715578889fd5b8895505b838610156117815786818f03121561172f578889fd5b8651878101818110878211171561174257fe5b8852813561174f81611abb565b8152818901356001600160601b0381168114611769578a8bfd5b818a0152835260019590950194918701918601611719565b50999c989b50989960600135985050505050505050565b600080604083850312156117aa578182fd5b823567ffffffffffffffff808211156117c1578384fd5b818501915085601f8301126117d4578384fd5b813560206117e461143d836119f2565b82815281810190858301838502870184018b1015611800578889fd5b8896505b8487101561182b57803561181781611abb565b835260019690960195918301918301611804565b5096505086013592505080821115611841578283fd5b5061184e8582860161141d565b9150509250929050565b600060208284031215611869578081fd5b81356001600160e01b031981168114610c0f578182fd5b600060208284031215611891578081fd5b5035919050565b6000815180845260208085019450808401835b838110156118e457815180516001600160a01b031688528301516001600160601b031683880152604090960195908201906001016118ab565b509495945050505050565b600060208252610c0f6020830184611898565b6020808252825182820181905260009190848201906040850190845b8181101561193a5783518352928401929184019160010161191e565b50909695505050505050565b901515815260200190565b6000602080835283518082850152825b8181101561197d57858101830151858201604001528201611961565b8181111561198e5783604083870101525b50601f01601f1916929092016040019392505050565b90815260200190565b6000838252604060208301526119c66040830184611898565b949350505050565b60405181810167ffffffffffffffff811182821017156119ea57fe5b604052919050565b600067ffffffffffffffff821115611a0657fe5b5060209081020190565b60e01c90565b600060443d1015611a2657610b1b565b600481823e6308c379a0611a3a8251611a10565b14611a4457610b1b565b6040513d600319016004823e80513d67ffffffffffffffff8160248401118184111715611a745750505050610b1b565b82840192508251915080821115611a8e5750505050610b1b565b503d83016020828401011115611aa657505050610b1b565b601f01601f1916810160200160405291505090565b6001600160a01b03811681146107a857600080fdfe455243313135353a207472616e7366657220746f206e6f6e2045524331313535526563656976657220696d706c656d656e746572455243313135353a204552433131353552656365697665722072656a656374656420746f6b656e73455243313135353a2062616c616e636520717565727920666f7220746865207a65726f2061646472657373455243313135353a2063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564455243313135353a207472616e7366657220746f20746865207a65726f2061646472657373455243313135353a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a6564455243313135353a20696e73756666696369656e742062616c616e636520666f72207472616e73666572526f79616c747920746f74616c2076616c75652073686f756c64206265203c203130303030455243313135353a2073657474696e6720617070726f76616c2073746174757320666f722073656c66455243313135353a206163636f756e747320616e6420696473206c656e677468206d69736d61746368455243313135353a2069647320616e6420616d6f756e7473206c656e677468206d69736d61746368455243313135353a206d696e7420746f20746865207a65726f2061646472657373a2646970667358221220b35f5534ec7c3ace6f5cb05eab05cb0d2a3e2b916e0c541fc5c7c902825e5d0864736f6c63430007060033";

export class TestERC1155WithRoyaltiesV2__factory extends ContractFactory {
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
  ): Promise<TestERC1155WithRoyaltiesV2> {
    return super.deploy(overrides || {}) as Promise<TestERC1155WithRoyaltiesV2>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): TestERC1155WithRoyaltiesV2 {
    return super.attach(address) as TestERC1155WithRoyaltiesV2;
  }
  connect(signer: Signer): TestERC1155WithRoyaltiesV2__factory {
    return super.connect(signer) as TestERC1155WithRoyaltiesV2__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TestERC1155WithRoyaltiesV2Interface {
    return new utils.Interface(_abi) as TestERC1155WithRoyaltiesV2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestERC1155WithRoyaltiesV2 {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as TestERC1155WithRoyaltiesV2;
  }
}
