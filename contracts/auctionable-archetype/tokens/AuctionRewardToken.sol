// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IRewardToken.sol";

contract AuctionRewardToken is ERC20, Ownable, IRewardToken {

address internal _minter;
	uint256 private _rewardRatio = 1;

	constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

	function mint(address to, uint256 amount) public override onlyMinter {
		_mint(to, amount);
	}

	function setMinter(address minter) external onlyOwner {
		_minter = minter;
	}

	function setRewardRatio(uint256 rewardRatio) external onlyOwner {
		_rewardRatio = rewardRatio;
	}

	/**
	 * @dev Guards a function such that only the minter is authorized to call it.
	 */
	modifier onlyMinter() virtual {
		require(msg.sender == _minter, "Unauthorized minter.");
		_;
	}

	function getRewardRatio() external view override returns (uint256) {
		return _rewardRatio;
	}
}
