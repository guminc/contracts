// SPDX-License-Identifier: MIT
// Creator: Flurks by Stonetoss
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract NFTContractFactory {
  NFT[] contracts;

  function createNFTContract(string memory _name, string memory _symbol)
    external
    returns (address nftAddress)
  {
    NFT nftContract = new NFT(_name, _symbol);
    contracts.push(nftContract);
    console.log(address(nftContract));
    nftAddress = address(nftContract);
  }
}

contract NFT is ERC721A, Ownable {
  using SafeMath for uint256;

  bool public paused = true;
  bool public revealed = false;

  bool public uriUnlocked = true;
  string private _baseURIPrefix;
  string public notRevealedUri = "ipfs://QmNsrxoVdgkBbHH7qemsoHYvoxgW8wQ2KTwE5G1LdLXEJW/";

  uint256 private tokenPrice = 0.05 ether;
  uint256 private constant maxNfts = 5000;
  uint256 private maxBatchSize = 20;

  constructor(string memory name_, string memory symbol_) ERC721A(name_, symbol_) {}

  function mint(uint256 quantity) external payable {
    require(
      tokenPrice.mul(quantity) <= msg.value,
      "You didn't include enough ETH with your transaction"
    );
    require(!paused, "ERC721A: Minting currently disabled");
    require(quantity <= maxBatchSize, "ERC721A: quantity to mint too high");
    require(
      _currentIndex.add(quantity) <= maxNfts,
      "The number you're trying to buy exceeds the remaining supply!"
    );

    _safeMint(msg.sender, quantity);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

    if (revealed == false) {
      return string(abi.encodePacked(notRevealedUri, Strings.toString(tokenId)));
    }

    string memory baseURI = _baseURI();
    return
      bytes(baseURI).length != 0
        ? string(abi.encodePacked(baseURI, Strings.toString(tokenId)))
        : "";
  }

  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  function reveal() public onlyOwner {
    revealed = true;
  }

  function lockURI(string memory password) public onlyOwner {
    require(
      keccak256(abi.encodePacked(password)) == keccak256(abi.encodePacked("forever")),
      "You need to explicitly pass the string 'forever'"
    );

    uriUnlocked = false;
  }

  function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
    notRevealedUri = _notRevealedURI;
  }

  function setBaseURI(string memory baseURIPrefix) public onlyOwner {
    require(uriUnlocked, "The token URI has been locked forever.");
    _baseURIPrefix = baseURIPrefix;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseURIPrefix;
  }
}
