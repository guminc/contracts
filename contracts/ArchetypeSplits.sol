// SPDX-License-Identifier: MIT
// ArchetypeSplits v0.7.0
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

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

error InvalidLength();
error InvalidSplitShares();
error TransferFailed();
error BalanceEmpty();

contract ArchetypeSplits is Ownable {
  event Withdrawal(address indexed src, address token, uint256 wad);

  mapping(address => mapping(address => uint256)) public balances;

  function updateBalances(
    uint256 totalAmount,
    address token,
    address[] calldata recipients,
    uint32[] calldata splits
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
        uint256 amountToAdd = (totalReceived * splits[i]) / 10000;
        balances[recipients[i]][token] += amountToAdd;
      }
    } else {
      // ERC20 payments
      IERC20 paymentToken = IERC20(token);
      paymentToken.transferFrom(msg.sender, address(this), totalAmount);

      for (uint256 i = 0; i < recipients.length; i++) {
        uint256 amountToAdd = (totalAmount * splits[i]) / 10000;
        balances[recipients[i]][token] += amountToAdd;
      }
    }
  }

  function withdraw() external onlyOwner {
    address[] memory tokens = new address[](1);
    tokens[0] = address(0);
    withdrawTokens(tokens);
  }

  function withdrawTokens(address[] memory tokens) public onlyOwner {
    address msgSender = msg.sender;

    for (uint256 i = 0; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      uint256 wad;

      wad = balances[msgSender][tokenAddress];
      balances[msgSender][tokenAddress] = 0;

      if (wad == 0) {
        revert BalanceEmpty();
      }

      if (tokenAddress == address(0)) {
        bool success = false;
        (success, ) = msgSender.call{ value: wad }("");
        if (!success) {
          revert TransferFailed();
        }
      } else {
        IERC20 erc20Token = IERC20(tokenAddress);
        erc20Token.transfer(msgSender, wad);
      }
      emit Withdrawal(msgSender, tokenAddress, wad);
    }
  }
}
