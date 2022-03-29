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
    uint256 _maxNfts
  ) external returns (address nftAddress) {
    ScatterNFT nftContract = new ScatterNFT(_name, _symbol, _unrevealedUri, _tokenPrice, _maxNfts);
    contracts.push(nftContract);
    nftAddress = address(nftContract);

    userToContract[msg.sender] = nftAddress;
  }
}
