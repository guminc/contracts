// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../LibOrder.sol";

contract LibOrderTest {
  function calculateRemaining(
    LibOrder.Order calldata order,
    uint256 fill,
    bool isMakeFill
  ) external pure returns (uint256 makeAmount, uint256 takeAmount) {
    return LibOrder.calculateRemaining(order, fill, isMakeFill);
  }

  function hashKey(LibOrder.Order calldata order)
    external
    pure
    returns (bytes32)
  {
    return LibOrder.hashKey(order);
  }

  function validate(LibOrder.Order calldata order) external view {
    LibOrder.validate(order);
  }

  function hashV2(
    address maker,
    LibAsset.Asset memory makeAsset,
    LibAsset.Asset memory takeAsset,
    uint256 salt,
    bytes memory data
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          maker,
          LibAsset.hash(makeAsset.assetType),
          LibAsset.hash(takeAsset.assetType),
          salt,
          data
        )
      );
  }

  function hashV1(
    address maker,
    LibAsset.Asset memory makeAsset,
    LibAsset.Asset memory takeAsset,
    uint256 salt
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          maker,
          LibAsset.hash(makeAsset.assetType),
          LibAsset.hash(takeAsset.assetType),
          salt
        )
      );
  }
}
