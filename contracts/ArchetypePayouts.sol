// SPDX-License-Identifier: MIT
// ArchetypePayouts v0.7.0
//
//        d8888                 888               888
//       d88888                 888               888
//      d88P888                 888               888
//     d88P 888 888d888 .d8888b 88888b.   .d88b.  888888 888  888 88888b.   .d88b.
//    d88P  888 888P"  d88P"    888 "88b d8P  Y8b 888    888  888 888 "88b d8P  Y8b
//   d88P   888 888    888      888  888 88888888 888    888  888 888  888 88888888
//  d8888888888 888    Y88b.    888  888 Y8b.     Y88b.  Y88b 888 888 d88P Y8b.
// d88P     888 888     "Y8888P 888  888  "Y8888   "Y888  "Y88888 88888P"   "Y8888
//                                                            888 888
//                                                       Y8b d88P 888
//

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error InvalidLength();
error InvalidSplitShares();
error TransferFailed();
error BalanceEmpty();
error NotApprovedToWithdraw();

contract ArchetypePayouts {
  event Withdrawal(address indexed src, address token, uint256 wad);
  event FundsAdded(address indexed recipient, address token, uint256 amount);

  mapping(address => mapping(address => uint256)) private _balance;
  mapping(address => mapping(address => bool)) private _approvals;

  function updateBalances(
    uint256 totalAmount,
    address token,
    address[] calldata recipients,
    uint16[] calldata splits
  ) public payable {
    if (recipients.length != splits.length) {
      revert InvalidLength();
    }

    uint256 totalShares = 0;
    for (uint256 i = 0; i < splits.length; i++) {
      totalShares += splits[i];
    }
    if (totalShares != 10000) {
      revert InvalidSplitShares();
    }

    if (token == address(0)) {
      // ETH payments
      uint256 totalReceived = msg.value;
      for (uint256 i = 0; i < recipients.length; i++) {
        if (splits[i] > 0) {
          uint256 amountToAdd = (totalReceived * splits[i]) / 10000;
          _balance[recipients[i]][token] += amountToAdd;
          emit FundsAdded(recipients[i], token, amountToAdd);
        }
      }
    } else {
      // ERC20 payments
      IERC20 paymentToken = IERC20(token);
      bool success = paymentToken.transferFrom(msg.sender, address(this), totalAmount);
      if (!success) {
        revert TransferFailed();
      }

      for (uint256 i = 0; i < recipients.length; i++) {
        if (splits[i] > 0) {
          uint256 amountToAdd = (totalAmount * splits[i]) / 10000;
          _balance[recipients[i]][token] += amountToAdd;
          emit FundsAdded(recipients[i], token, amountToAdd);
        }
      }
    }
  }

  function withdraw() external {
    address msgSender = msg.sender;
    _withdraw(msgSender, msgSender, address(0));
  }

  function withdrawTokens(address[] memory tokens) external {
    address msgSender = msg.sender;

    for (uint256 i = 0; i < tokens.length; i++) {
      _withdraw(msgSender, msgSender, tokens[i]);
    }
  }

  function withdrawFrom(address from, address to) public {
    if (from != msg.sender && !_approvals[from][to]) {
      revert NotApprovedToWithdraw();
    }
    _withdraw(from, to, address(0));
  }

  function withdrawTokensFrom(
    address from,
    address to,
    address[] memory tokens
  ) public {
    if (from != msg.sender && !_approvals[from][to]) {
      revert NotApprovedToWithdraw();
    }
    for (uint256 i = 0; i < tokens.length; i++) {
      _withdraw(from, to, tokens[i]);
    }
  }

  function _withdraw(
    address from,
    address to,
    address token
  ) internal {
    uint256 wad;

    wad = _balance[from][token];
    _balance[from][token] = 0;

    if (wad == 0) {
      revert BalanceEmpty();
    }

    if (token == address(0)) {
      bool success = false;
      (success, ) = to.call{ value: wad }("");
      if (!success) {
        revert TransferFailed();
      }
    } else {
      IERC20 erc20Token = IERC20(token);
      bool success = erc20Token.transfer(to, wad);
      if (!success) {
        revert TransferFailed();
      }
    }
    emit Withdrawal(from, token, wad);
  }

  function approveWithdrawal(address delegate, bool approved) external {
    _approvals[msg.sender][delegate] = approved;
  }

  function isApproved(address from, address delegate) external view returns (bool) {
    return _approvals[from][delegate];
  }

  function balance(address recipient) external view returns (uint256) {
    return _balance[recipient][address(0)];
  }

  function balanceToken(address recipient, address token) external view returns (uint256) {
    return _balance[recipient][token];
  }
}
