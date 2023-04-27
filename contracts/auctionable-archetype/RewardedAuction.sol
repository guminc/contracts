// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "./ScatterAuction.sol";
import "./tokens/IRewardToken.sol";

contract RewardedAuction is ScatterAuction {

	/**
	 * @dev Amount of eth bidded by an address.
	 */
	mapping(address => uint256) public rewardTokenShares;

	address public rewardToken;

	function createBid(uint256 nftId) override public payable {
		super.createBid(nftId);
		rewardTokenShares[msg.sender] += msg.value;
	}
	
	function claimRewardTokensBasedOnShares() public {
		require(rewardToken != address(0), "No reward token for this auction.");
		
		IRewardToken token = IRewardToken(rewardToken);
		token.mint(
			msg.sender,
			rewardTokenShares[msg.sender] * token.getRewardRatio()
		);
		rewardTokenShares[msg.sender] = 0;
	}

	function setRewardTokenAddress(address _rewardToken) public onlyOwner {
		rewardToken = _rewardToken;
	}
}
