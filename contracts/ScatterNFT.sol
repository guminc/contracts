// SPDX-License-Identifier: MIT
// Creator: Scatter v0.0.2
//        ___           ___           ___           ___           ___           ___           ___
//       /\  \         /\  \         /\  \         /\  \         /\  \         /\  \         /\  \
//      /::\  \       /::\  \       /::\  \        \:\  \        \:\  \       /::\  \       /::\  \
//     /:/\ \  \     /:/\:\  \     /:/\:\  \        \:\  \        \:\  \     /:/\:\  \     /:/\:\  \
//    _\:\~\ \  \   /:/  \:\  \   /::\~\:\  \       /::\  \       /::\  \   /::\~\:\  \   /::\~\:\  \
//   /\ \:\ \ \__\ /:/__/ \:\__\ /:/\:\ \:\__\     /:/\:\__\     /:/\:\__\ /:/\:\ \:\__\ /:/\:\ \:\__\
//   \:\ \:\ \/__/ \:\  \  \/__/ \/__\:\/:/  /    /:/  \/__/    /:/  \/__/ \:\~\:\ \/__/ \/_|::\/:/  /
//    \:\ \:\__\    \:\  \            \::/  /    /:/  /        /:/  /       \:\ \:\__\      |:|::/  /
//     \:\/:/  /     \:\  \           /:/  /     \/__/         \/__/         \:\ \/__/      |:|\/__/
//      \::/  /       \:\__\         /:/  /                                   \:\__\        |:|  |
//       \/__/         \/__/         \/__/                                     \/__/         \|__|

pragma solidity ^0.8.4;

import "./ERC721A.sol";
import "./Ownable.sol";
import "./CustomInitializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ScatterNFT is CustomInitializable, ERC721A, Ownable {
  using SafeMath for uint256;

  bool public paused = true;
  bool public revealed = false;

  bool public uriUnlocked = true;
  string private _baseURIPrefix;

  string public provenance;
  bool public provenanceHashUnlocked = true;
  Config public config;

  struct Config {
    uint256 maxSupply;
    uint256 maxBatchSize;
    string unrevealedUri;
    uint256 tokenPrice;
  }

  function initialize(
    string memory name,
    string memory symbol,
    Config calldata config_
  ) external initializer {
    console.log("Archetype is initializing");
    __ERC721_init(name, symbol);
    config = config_;

    console.log("Initializing ownable upgradeable");
    __Ownable_init();
    setConfig(_config);
  }

  constructor(
    string memory name_,
    string memory symbol_,
    string memory unrevealedUri_,
    uint256 tokenPrice_,
    uint256 maxSupply_,
    uint256 maxBatchSize_
  ) ERC721A(name_, symbol_) {
    unrevealedUri = unrevealedUri_;
    tokenPrice = tokenPrice_;
    maxSupply = maxSupply_;
    maxBatchSize = maxBatchSize_;
  }

  function mint(uint256 quantity) external payable {
    require(
      tokenPrice.mul(quantity) <= msg.value,
      "You didn't include enough ETH with your transaction"
    );
    require(!paused, "ERC721A: Minting currently disabled");
    require(quantity <= maxBatchSize, "ERC721A: quantity to mint too high");
    require(
      _currentIndex.add(quantity) <= maxSupply,
      "The number you're trying to buy exceeds the remaining supply!"
    );

    _safeMint(msg.sender, quantity);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

    if (revealed == false) {
      return string(abi.encodePacked(unrevealedUri, Strings.toString(tokenId)));
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

  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }

  /// @notice the password is "forever"
  function lockURI(string memory password) public onlyOwner {
    require(
      keccak256(abi.encodePacked(password)) == keccak256(abi.encodePacked("forever")),
      "You need to explicitly pass the string 'forever'"
    );

    uriUnlocked = false;
  }

  function setUnrevealedURI(string memory _unrevealedURI) public onlyOwner {
    unrevealedUri = _unrevealedURI;
  }

  function setBaseURI(string memory baseURIPrefix) public onlyOwner {
    require(uriUnlocked, "The token URI has been locked forever.");
    _baseURIPrefix = baseURIPrefix;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseURIPrefix;
  }

  /// @notice Set BAYC-style provenance once it's calculated
  function setProvenanceHash(string memory provenanceHash) public onlyOwner {
    require(provenanceHashUnlocked, "The provenance hash has been locked forever.");

    provenance = provenanceHash;
  }

  /// @notice the password is "forever"
  function lockProvenanceHash(string memory password) public onlyOwner {
    require(
      keccak256(abi.encodePacked(password)) == keccak256(abi.encodePacked("forever")),
      "You need to explicitly pass the string 'forever'"
    );

    provenanceHashUnlocked = false;
  }

  function withdraw() public onlyOwner {
    uint256 balance = address(this).balance;
    uint256 cut = balance.div(50);
    uint256 remainder = balance.sub(cut);

    address scatter = 0x60A59d7003345843BE285c15c7C78B62b61e0d7c;

    payable(scatter).transfer(cut);
    payable(owner()).transfer(remainder);
  }
}
