// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface ILoyaltyPointsToken {

  function registerReceivedToken(address owner, uint256 collectionTokenId) external;

  function registerSentToken(address owner, uint256 collectionTokenId) external;

  function mintTo(address to) external;

  function hasToken(address receiver) external returns (bool);
}
