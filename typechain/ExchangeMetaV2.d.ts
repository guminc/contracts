/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface ExchangeMetaV2Interface extends ethers.utils.Interface {
  functions: {
    "__ExchangeV2_init(address,address,uint256,address,address)": FunctionFragment;
    "cancel((address,((bytes4,bytes),uint256),address,((bytes4,bytes),uint256),uint256,uint256,uint256,bytes4,bytes))": FunctionFragment;
    "defaultFeeReceiver()": FunctionFragment;
    "executeMetaTransaction(address,bytes,bytes32,bytes32,uint8)": FunctionFragment;
    "feeReceivers(address)": FunctionFragment;
    "fills(bytes32)": FunctionFragment;
    "getNonce(address)": FunctionFragment;
    "matchOrders((address,((bytes4,bytes),uint256),address,((bytes4,bytes),uint256),uint256,uint256,uint256,bytes4,bytes),bytes,(address,((bytes4,bytes),uint256),address,((bytes4,bytes),uint256),uint256,uint256,uint256,bytes4,bytes),bytes)": FunctionFragment;
    "owner()": FunctionFragment;
    "protocolFee()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "royaltiesRegistry()": FunctionFragment;
    "setAssetMatcher(bytes4,address)": FunctionFragment;
    "setDefaultFeeReceiver(address)": FunctionFragment;
    "setFeeReceiver(address,address)": FunctionFragment;
    "setProtocolFee(uint256)": FunctionFragment;
    "setRoyaltiesRegistry(address)": FunctionFragment;
    "setTransferProxy(bytes4,address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "__ExchangeV2_init",
    values: [string, string, BigNumberish, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "cancel",
    values: [
      {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      }
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "defaultFeeReceiver",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "executeMetaTransaction",
    values: [string, BytesLike, BytesLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "feeReceivers",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "fills", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "getNonce", values: [string]): string;
  encodeFunctionData(
    functionFragment: "matchOrders",
    values: [
      {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      BytesLike,
      {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      BytesLike
    ]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "protocolFee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "royaltiesRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setAssetMatcher",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setDefaultFeeReceiver",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setFeeReceiver",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setProtocolFee",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setRoyaltiesRegistry",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setTransferProxy",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "__ExchangeV2_init",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "cancel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "defaultFeeReceiver",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "executeMetaTransaction",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "feeReceivers",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "fills", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getNonce", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "matchOrders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "protocolFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "royaltiesRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAssetMatcher",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setDefaultFeeReceiver",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setFeeReceiver",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setProtocolFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setRoyaltiesRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTransferProxy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "Cancel(bytes32,address,tuple,tuple)": EventFragment;
    "Match(bytes32,bytes32,address,address,uint256,uint256,tuple,tuple)": EventFragment;
    "MatcherChange(bytes4,address)": EventFragment;
    "MetaTransactionExecuted(address,address,bytes)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "ProxyChange(bytes4,address)": EventFragment;
    "Transfer(tuple,address,address,bytes4,bytes4)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Cancel"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Match"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MatcherChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MetaTransactionExecuted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ProxyChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

export type CancelEvent = TypedEvent<
  [
    string,
    string,
    [string, string] & { assetClass: string; data: string },
    [string, string] & { assetClass: string; data: string }
  ] & {
    hash: string;
    maker: string;
    makeAssetType: [string, string] & { assetClass: string; data: string };
    takeAssetType: [string, string] & { assetClass: string; data: string };
  }
>;

export type MatchEvent = TypedEvent<
  [
    string,
    string,
    string,
    string,
    BigNumber,
    BigNumber,
    [string, string] & { assetClass: string; data: string },
    [string, string] & { assetClass: string; data: string }
  ] & {
    leftHash: string;
    rightHash: string;
    leftMaker: string;
    rightMaker: string;
    newLeftFill: BigNumber;
    newRightFill: BigNumber;
    leftAsset: [string, string] & { assetClass: string; data: string };
    rightAsset: [string, string] & { assetClass: string; data: string };
  }
>;

export type MatcherChangeEvent = TypedEvent<
  [string, string] & { assetType: string; matcher: string }
>;

export type MetaTransactionExecutedEvent = TypedEvent<
  [string, string, string] & {
    userAddress: string;
    relayerAddress: string;
    functionSignature: string;
  }
>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { previousOwner: string; newOwner: string }
>;

export type ProxyChangeEvent = TypedEvent<
  [string, string] & { assetType: string; proxy: string }
>;

export type TransferEvent = TypedEvent<
  [
    [[string, string] & { assetClass: string; data: string }, BigNumber] & {
      assetType: [string, string] & { assetClass: string; data: string };
      value: BigNumber;
    },
    string,
    string,
    string,
    string
  ] & {
    asset: [
      [string, string] & { assetClass: string; data: string },
      BigNumber
    ] & {
      assetType: [string, string] & { assetClass: string; data: string };
      value: BigNumber;
    };
    from: string;
    to: string;
    transferDirection: string;
    transferType: string;
  }
>;

export class ExchangeMetaV2 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ExchangeMetaV2Interface;

  functions: {
    __ExchangeV2_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      newProtocolFee: BigNumberish,
      newDefaultFeeReceiver: string,
      newRoyaltiesProvider: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancel(
      order: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    defaultFeeReceiver(overrides?: CallOverrides): Promise<[string]>;

    executeMetaTransaction(
      userAddress: string,
      functionSignature: BytesLike,
      sigR: BytesLike,
      sigS: BytesLike,
      sigV: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    feeReceivers(arg0: string, overrides?: CallOverrides): Promise<[string]>;

    fills(arg0: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;

    getNonce(
      user: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { nonce: BigNumber }>;

    matchOrders(
      orderLeft: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureLeft: BytesLike,
      orderRight: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureRight: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    protocolFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    royaltiesRegistry(overrides?: CallOverrides): Promise<[string]>;

    setAssetMatcher(
      assetType: BytesLike,
      matcher: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setDefaultFeeReceiver(
      newDefaultFeeReceiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setFeeReceiver(
      token: string,
      wallet: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setProtocolFee(
      newProtocolFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setRoyaltiesRegistry(
      newRoyaltiesRegistry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  __ExchangeV2_init(
    _transferProxy: string,
    _erc20TransferProxy: string,
    newProtocolFee: BigNumberish,
    newDefaultFeeReceiver: string,
    newRoyaltiesProvider: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancel(
    order: {
      maker: string;
      makeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      taker: string;
      takeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      salt: BigNumberish;
      start: BigNumberish;
      end: BigNumberish;
      dataType: BytesLike;
      data: BytesLike;
    },
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  defaultFeeReceiver(overrides?: CallOverrides): Promise<string>;

  executeMetaTransaction(
    userAddress: string,
    functionSignature: BytesLike,
    sigR: BytesLike,
    sigS: BytesLike,
    sigV: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  feeReceivers(arg0: string, overrides?: CallOverrides): Promise<string>;

  fills(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

  getNonce(user: string, overrides?: CallOverrides): Promise<BigNumber>;

  matchOrders(
    orderLeft: {
      maker: string;
      makeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      taker: string;
      takeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      salt: BigNumberish;
      start: BigNumberish;
      end: BigNumberish;
      dataType: BytesLike;
      data: BytesLike;
    },
    signatureLeft: BytesLike,
    orderRight: {
      maker: string;
      makeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      taker: string;
      takeAsset: {
        assetType: { assetClass: BytesLike; data: BytesLike };
        value: BigNumberish;
      };
      salt: BigNumberish;
      start: BigNumberish;
      end: BigNumberish;
      dataType: BytesLike;
      data: BytesLike;
    },
    signatureRight: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  royaltiesRegistry(overrides?: CallOverrides): Promise<string>;

  setAssetMatcher(
    assetType: BytesLike,
    matcher: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setDefaultFeeReceiver(
    newDefaultFeeReceiver: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setFeeReceiver(
    token: string,
    wallet: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setProtocolFee(
    newProtocolFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setRoyaltiesRegistry(
    newRoyaltiesRegistry: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setTransferProxy(
    assetType: BytesLike,
    proxy: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    __ExchangeV2_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      newProtocolFee: BigNumberish,
      newDefaultFeeReceiver: string,
      newRoyaltiesProvider: string,
      overrides?: CallOverrides
    ): Promise<void>;

    cancel(
      order: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      overrides?: CallOverrides
    ): Promise<void>;

    defaultFeeReceiver(overrides?: CallOverrides): Promise<string>;

    executeMetaTransaction(
      userAddress: string,
      functionSignature: BytesLike,
      sigR: BytesLike,
      sigS: BytesLike,
      sigV: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    feeReceivers(arg0: string, overrides?: CallOverrides): Promise<string>;

    fills(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    getNonce(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    matchOrders(
      orderLeft: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureLeft: BytesLike,
      orderRight: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureRight: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    royaltiesRegistry(overrides?: CallOverrides): Promise<string>;

    setAssetMatcher(
      assetType: BytesLike,
      matcher: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setDefaultFeeReceiver(
      newDefaultFeeReceiver: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setFeeReceiver(
      token: string,
      wallet: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setProtocolFee(
      newProtocolFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setRoyaltiesRegistry(
      newRoyaltiesRegistry: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Cancel(bytes32,address,tuple,tuple)"(
      hash?: null,
      maker?: null,
      makeAssetType?: null,
      takeAssetType?: null
    ): TypedEventFilter<
      [
        string,
        string,
        [string, string] & { assetClass: string; data: string },
        [string, string] & { assetClass: string; data: string }
      ],
      {
        hash: string;
        maker: string;
        makeAssetType: [string, string] & { assetClass: string; data: string };
        takeAssetType: [string, string] & { assetClass: string; data: string };
      }
    >;

    Cancel(
      hash?: null,
      maker?: null,
      makeAssetType?: null,
      takeAssetType?: null
    ): TypedEventFilter<
      [
        string,
        string,
        [string, string] & { assetClass: string; data: string },
        [string, string] & { assetClass: string; data: string }
      ],
      {
        hash: string;
        maker: string;
        makeAssetType: [string, string] & { assetClass: string; data: string };
        takeAssetType: [string, string] & { assetClass: string; data: string };
      }
    >;

    "Match(bytes32,bytes32,address,address,uint256,uint256,tuple,tuple)"(
      leftHash?: null,
      rightHash?: null,
      leftMaker?: null,
      rightMaker?: null,
      newLeftFill?: null,
      newRightFill?: null,
      leftAsset?: null,
      rightAsset?: null
    ): TypedEventFilter<
      [
        string,
        string,
        string,
        string,
        BigNumber,
        BigNumber,
        [string, string] & { assetClass: string; data: string },
        [string, string] & { assetClass: string; data: string }
      ],
      {
        leftHash: string;
        rightHash: string;
        leftMaker: string;
        rightMaker: string;
        newLeftFill: BigNumber;
        newRightFill: BigNumber;
        leftAsset: [string, string] & { assetClass: string; data: string };
        rightAsset: [string, string] & { assetClass: string; data: string };
      }
    >;

    Match(
      leftHash?: null,
      rightHash?: null,
      leftMaker?: null,
      rightMaker?: null,
      newLeftFill?: null,
      newRightFill?: null,
      leftAsset?: null,
      rightAsset?: null
    ): TypedEventFilter<
      [
        string,
        string,
        string,
        string,
        BigNumber,
        BigNumber,
        [string, string] & { assetClass: string; data: string },
        [string, string] & { assetClass: string; data: string }
      ],
      {
        leftHash: string;
        rightHash: string;
        leftMaker: string;
        rightMaker: string;
        newLeftFill: BigNumber;
        newRightFill: BigNumber;
        leftAsset: [string, string] & { assetClass: string; data: string };
        rightAsset: [string, string] & { assetClass: string; data: string };
      }
    >;

    "MatcherChange(bytes4,address)"(
      assetType?: BytesLike | null,
      matcher?: null
    ): TypedEventFilter<
      [string, string],
      { assetType: string; matcher: string }
    >;

    MatcherChange(
      assetType?: BytesLike | null,
      matcher?: null
    ): TypedEventFilter<
      [string, string],
      { assetType: string; matcher: string }
    >;

    "MetaTransactionExecuted(address,address,bytes)"(
      userAddress?: null,
      relayerAddress?: null,
      functionSignature?: null
    ): TypedEventFilter<
      [string, string, string],
      { userAddress: string; relayerAddress: string; functionSignature: string }
    >;

    MetaTransactionExecuted(
      userAddress?: null,
      relayerAddress?: null,
      functionSignature?: null
    ): TypedEventFilter<
      [string, string, string],
      { userAddress: string; relayerAddress: string; functionSignature: string }
    >;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    "ProxyChange(bytes4,address)"(
      assetType?: BytesLike | null,
      proxy?: null
    ): TypedEventFilter<[string, string], { assetType: string; proxy: string }>;

    ProxyChange(
      assetType?: BytesLike | null,
      proxy?: null
    ): TypedEventFilter<[string, string], { assetType: string; proxy: string }>;

    "Transfer(tuple,address,address,bytes4,bytes4)"(
      asset?: null,
      from?: null,
      to?: null,
      transferDirection?: null,
      transferType?: null
    ): TypedEventFilter<
      [
        [[string, string] & { assetClass: string; data: string }, BigNumber] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        },
        string,
        string,
        string,
        string
      ],
      {
        asset: [
          [string, string] & { assetClass: string; data: string },
          BigNumber
        ] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        };
        from: string;
        to: string;
        transferDirection: string;
        transferType: string;
      }
    >;

    Transfer(
      asset?: null,
      from?: null,
      to?: null,
      transferDirection?: null,
      transferType?: null
    ): TypedEventFilter<
      [
        [[string, string] & { assetClass: string; data: string }, BigNumber] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        },
        string,
        string,
        string,
        string
      ],
      {
        asset: [
          [string, string] & { assetClass: string; data: string },
          BigNumber
        ] & {
          assetType: [string, string] & { assetClass: string; data: string };
          value: BigNumber;
        };
        from: string;
        to: string;
        transferDirection: string;
        transferType: string;
      }
    >;
  };

  estimateGas: {
    __ExchangeV2_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      newProtocolFee: BigNumberish,
      newDefaultFeeReceiver: string,
      newRoyaltiesProvider: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancel(
      order: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    defaultFeeReceiver(overrides?: CallOverrides): Promise<BigNumber>;

    executeMetaTransaction(
      userAddress: string,
      functionSignature: BytesLike,
      sigR: BytesLike,
      sigS: BytesLike,
      sigV: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    feeReceivers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    fills(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    getNonce(user: string, overrides?: CallOverrides): Promise<BigNumber>;

    matchOrders(
      orderLeft: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureLeft: BytesLike,
      orderRight: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureRight: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    royaltiesRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    setAssetMatcher(
      assetType: BytesLike,
      matcher: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setDefaultFeeReceiver(
      newDefaultFeeReceiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setFeeReceiver(
      token: string,
      wallet: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setProtocolFee(
      newProtocolFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setRoyaltiesRegistry(
      newRoyaltiesRegistry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    __ExchangeV2_init(
      _transferProxy: string,
      _erc20TransferProxy: string,
      newProtocolFee: BigNumberish,
      newDefaultFeeReceiver: string,
      newRoyaltiesProvider: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancel(
      order: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    defaultFeeReceiver(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    executeMetaTransaction(
      userAddress: string,
      functionSignature: BytesLike,
      sigR: BytesLike,
      sigS: BytesLike,
      sigV: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    feeReceivers(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    fills(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getNonce(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    matchOrders(
      orderLeft: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureLeft: BytesLike,
      orderRight: {
        maker: string;
        makeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        taker: string;
        takeAsset: {
          assetType: { assetClass: BytesLike; data: BytesLike };
          value: BigNumberish;
        };
        salt: BigNumberish;
        start: BigNumberish;
        end: BigNumberish;
        dataType: BytesLike;
        data: BytesLike;
      },
      signatureRight: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    protocolFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    royaltiesRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setAssetMatcher(
      assetType: BytesLike,
      matcher: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setDefaultFeeReceiver(
      newDefaultFeeReceiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setFeeReceiver(
      token: string,
      wallet: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setProtocolFee(
      newProtocolFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setRoyaltiesRegistry(
      newRoyaltiesRegistry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setTransferProxy(
      assetType: BytesLike,
      proxy: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}