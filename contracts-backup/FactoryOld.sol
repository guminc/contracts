// SPDX-License-Identifier: MIT
// Creator: Scatter.art
pragma solidity ^0.8.4;

import "./ScatterNFT.sol";

contract NFTContractFactory {
  mapping(address => address) public userToContract;

  /**
   * @dev Emitted when an NFT Contract is deployed
   */
  event Deploy(address indexed from, string name, address indexed contractAddress);

  function createNFTContract(
    string memory _name,
    string memory _symbol,
    string memory _unrevealedUri,
    uint256 _tokenPrice,
    uint256 _maxSupply,
    uint256 _maxBatchSize
  ) external returns (address nftAddress) {
    ScatterNFT nftContract = new ScatterNFT(
      _name,
      _symbol,
      _unrevealedUri,
      _tokenPrice,
      _maxSupply,
      _maxBatchSize
    );

    nftAddress = address(nftContract);

    emit Deploy(msg.sender, _name, nftAddress);

    userToContract[msg.sender] = nftAddress;
  }
}
