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
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface ITransferManagerInterface extends ethers.utils.Interface {
  functions: {};

  events: {
    "Transfer(tuple,address,address,bytes4,bytes4)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

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

export class ITransferManager extends BaseContract {
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

  interface: ITransferManagerInterface;

  functions: {};

  callStatic: {};

  filters: {
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

  estimateGas: {};

  populateTransaction: {};
}
