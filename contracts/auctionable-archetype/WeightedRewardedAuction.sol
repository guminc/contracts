// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "./ScatterAuction.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "solady/src/utils/MerkleProofLib.sol";

contract WeightedRewardedAuction is ScatterAuction {

	/**
	 * @dev Because solidity doesn't suppor floats, we will use
	 * ratios as weights. This should be abstracted in the front-end
	 * for a better UX.
	 * @param x y Such that x/y.
	 */
	struct Ratio {
		uint256 x; uint256 y;
	}

	/**
	 * @dev Amount of eth bidded by an address.
	 */
	mapping(address => uint256) internal _rewardTokenShares;

	/**
	 * @dev Reward token held by this contract to redistribute
	 * to bidders as incentive.
	 */
	address internal _rewardToken;

	/**
	 * @dev Contract with merkle root that holds the balance of
	 * rewardable tokens for each bidder.
	 */
	address internal _rewardsBoosterStorage;
	
	/**
	 * @dev Ratio of reward tokens to give a bidder for every eth
	 * bidded. 
	 */
	Ratio internal _rewardRatio = Ratio(1, 1);
	
	/**
	 * @dev Decimal weight for extra rewards based on rewardable
	 * tokens held. See `rewardsBoosterStorage`. Set to (0,0)
	 * if you want to disable extra rewards.
	 */
	Ratio internal _extraRewardWeighing = Ratio(0, 0);
	
	/**
	 * @dev Merkle root that holds (address, rewardableTokensHeld) pairs.
	 */
	bytes32 public rewardableTokensHeldPerWalletRoot;


	function createBid(uint256 nftId) override public payable {
		super.createBid(nftId);
		_rewardTokenShares[msg.sender] += msg.value;
	}

	function getSharesFor(address bidder) public view returns (uint256) {
		return _rewardTokenShares[bidder];
	}

	/**
	 * @dev Note that to implement claiming logic you need to verify
	 * that `bidder` actually holds `uniqueDeriv`. See 
	 * `claimRewardTokensBasedOnShares`.
	 */
	function getRewardsFor(address bidder, uint256 uniqueDerivsHeld) 
		public 
		view 
		returns (uint256) 
	{
		uint256 share = _rewardTokenShares[bidder];
		uint256 baseAmount = share * _rewardRatio.x / _rewardRatio.y;

		if (!extraRewardsSupported()) return baseAmount;

		return baseAmount * (
			1 + uniqueDerivsHeld * _extraRewardWeighing.x / _extraRewardWeighing.y
		);
	}

	function claimRewardTokensBasedOnShares(
		bytes32[] memory proof, uint96 uniqueDerivsHeld
	) public {
		require(_rewardToken != address(0), "No reward token for this auction.");
		require(_rewardTokenShares[msg.sender] > 0, "No reward tokens to claim.");

		if (
			extraRewardsSupported() &&
			!checkBidderRewardableTokens(proof, msg.sender, uniqueDerivsHeld)
		)
			uniqueDerivsHeld = 0;
		
		IERC20 token = IERC20(_rewardToken);
		token.transfer(msg.sender, getRewardsFor(msg.sender, uniqueDerivsHeld));
		_rewardTokenShares[msg.sender] = 0;
	}

	function extraRewardsSupported() public view returns (bool) {
		return _extraRewardWeighing.x != 0 && _extraRewardWeighing.y != 0;
	}
	
	function checkBidderRewardableTokens(
		bytes32[] memory proof, address bidder, uint96 rewardableTokensHeld
	) public view returns (bool) {
		require(rewardableTokensHeldPerWalletRoot > 0, "Merkle root not initialized.");
		return MerkleProofLib.verify(
			proof,
			rewardableTokensHeldPerWalletRoot,
			keccak256(abi.encodePacked(bidder, rewardableTokensHeld))
		);
	}
	
	/**
	 * @dev Rewards configuration. Set `rewardToken` to `address(0)`
	 * to disable all rewards. Set `extraRatio` to `(0,0)` to disable
	 * all extra rewards based on the `rewardableTokensHeldRoot`.
	 */
	function configureRewards(
		address rewardToken,
		Ratio memory rewardRatio,
		Ratio memory extraRatio,
		bytes32 rewardableTokensHeldRoot
	) public onlyOwner {
		_rewardToken = rewardToken;
		_rewardRatio = rewardRatio;
		_extraRewardWeighing = extraRatio;
		rewardableTokensHeldPerWalletRoot = rewardableTokensHeldRoot;
	}

	function withdrawRewardToken() public onlyOwner {
		IERC20 token = IERC20(_rewardToken);
		token.transfer(msg.sender, token.balanceOf(address(this)));
	}
}
