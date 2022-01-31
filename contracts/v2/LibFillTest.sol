// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../LibOrder.sol";
import "../LibFill.sol";

contract LibFillTest {
  function fillOrder(
    LibOrder.Order calldata leftOrder,
    LibOrder.Order calldata rightOrder,
    uint256 leftOrderFill,
    uint256 rightOrderFill,
    bool leftIsMakeFill,
    bool rightIsMakeFill
  ) external pure returns (LibFill.FillResult memory) {
    return
      LibFill.fillOrder(
        leftOrder,
        rightOrder,
        leftOrderFill,
        rightOrderFill,
        leftIsMakeFill,
        rightIsMakeFill
      );
  }
}
