// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MinimalAuctionableNFT is ERC721, Ownable {

	address internal _minter;
	uint32 public nextTokenId;

	constructor(string memory name, string memory symbol) ERC721(name, symbol) {
		nextTokenId = 1;
	}

	function mint() external payable onlyMinter returns (uint256 tokenId) {
		tokenId = nextTokenId++;
		_mint(msg.sender, tokenId);
	}

  function setMinter(address minter) external onlyOwner {
    _minter = minter;
  }

	/**
	 * @dev Guards a function such that only the minter is authorized to call it.
	 */
	modifier onlyMinter() virtual {
		require(msg.sender == _minter, "Unauthorized minter.");
		_;
	}

	receive() external payable {}

	function withdraw() external onlyOwner {
		payable(msg.sender).transfer(address(this).balance);
	}
}
