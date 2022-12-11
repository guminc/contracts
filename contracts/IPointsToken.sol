// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IPointsToken {
  /**
   * register token ID movements from source collection
  */
  function registerTokenMovement(address from, address, to, uint256 collectionTokenStartId, uint256 quantity) external;

  /**
   * mint points token to provided address
  */
  function mintTo(address to) external;

  /**
   * check if address already associated with a points token
  */
  function hasToken(address receiver) external returns (bool);
}
