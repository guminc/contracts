// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IPointsToken {
  /**
   * register token ID from source collection as received by user
  */
  function registerReceivedToken(address owner, uint256 collectionTokenId) external;

  /**
   * register token ID from source collection as sent by user
  */
  function registerSentToken(address owner, uint256 collectionTokenId) external;

  /**
   * mint points token to provided address
  */
  function mintTo(address to) external;

  /**
   * check if address already associated with a points token
  */
  function hasToken(address receiver) external returns (bool);
}
