// SPDX-License-Identifier: MIT
// Creator: Scatter
pragma solidity ^0.8.4;

import "./ScatterNFT.sol";

contract NFTContractFactory {
  ScatterNFT[] private contracts;
  mapping(address => address) public userToContract;

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
    contracts.push(nftContract);
    nftAddress = address(nftContract);

    userToContract[msg.sender] = nftAddress;
  }
}
