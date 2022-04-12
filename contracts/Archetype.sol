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

import "hardhat/console.sol";
import "./ERC721A-Upgradeable.sol";
import "./ERC721AQueryable.sol";
// import "./OwnableUpgradeable.sol";
// import "./InitializableCustom.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

error MintNotYetStarted(uint256 block, uint64 start);
error WalletUnauthorizedToMint(address wallet, bytes32 authKey);
error InsufficientEthSent(uint256 sent, uint256 required);
error MintingCurrentlyPaused();
error MaxSupplyExceeded(uint256 numRequested, uint256 numAvailable);

// error MaxBatchSizeExceeded(uint256 numRequested, uint256 maxBatchSize);

contract Archetype is
  Initializable,
  ERC721AUpgradeable,
  PausableUpgradeable,
  ERC721AQueryable,
  OwnableUpgradeable
{
  using SafeMath for uint256;

  event Invited(bytes32 indexed key, bytes32 indexed cid);

  mapping(bytes32 => Invite) public invite;

  bool public revealed;
  bool public uriUnlocked;
  string public provenance;
  bool public provenanceHashUnlocked;

  Config public config;

  struct Auth {
    bytes32 key;
    bytes32[] proof;
  }

  struct Config {
    uint256 maxSupply;
    string unrevealedUri;
    string baseUri;
    // uint256 maxBatchSize;
    // uint256 tokenPrice;
  }

  struct Invite {
    uint128 price;
    uint64 start;
    uint64 limit;
  }

  struct Invitelist {
    bytes32 key;
    bytes32 cid;
    Invite invite;
  }

  function initialize(
    string memory name,
    string memory symbol,
    Config calldata config_
  ) external initializer {
    console.log("Archetype is initializing");
    __ERC721A_init(name, symbol);
    config = config_;
    console.log("Initializing Pausable upgradeable");
    __Pausable_init();
    console.log("Initializing Ownable upgradeable");
    __Ownable_init();
    revealed = false;
    uriUnlocked = true;
    provenanceHashUnlocked = true;
  }

  function mint(uint256 quantity, Auth calldata auth) external payable {
    Invite memory i = invite[auth.key];

    if (paused()) {
      revert MintingCurrentlyPaused();
    }

    if (!verify(auth, _msgSender())) {
      revert WalletUnauthorizedToMint({ wallet: _msgSender(), authKey: auth.key });
    }

    uint256 cost = i.price * quantity;

    if (msg.value < cost) {
      revert InsufficientEthSent({ sent: msg.value, required: cost });
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted({ block: block.timestamp, start: i.start });
    }

    // require(minted[_msgSender()][auth.key] + _count <= i.limit, "10");

    // if (quantity > config.maxBatchSize) {
    //   revert MaxBatchSizeExceeded({ numRequested: quantity, maxBatchSize: config.maxBatchSize });
    // }
    if (_currentIndex.add(quantity) > config.maxSupply) {
      revert MaxSupplyExceeded({
        numRequested: quantity,
        numAvailable: config.maxSupply - _currentIndex
      });
    }

    _safeMint(msg.sender, quantity);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

    if (revealed == false) {
      return string(abi.encodePacked(config.unrevealedUri, Strings.toString(tokenId)));
    }

    return
      bytes(config.baseUri).length != 0
        ? string(abi.encodePacked(config.baseUri, Strings.toString(tokenId)))
        : "";
  }

  function pause(bool _state) public onlyOwner {
    if (_state) {
      _pause();
    } else {
      _unpause();
    }
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
    config.unrevealedUri = _unrevealedURI;
  }

  function setBaseURI(string memory baseUri_) public onlyOwner {
    require(uriUnlocked, "The token URI has been locked forever.");
    config.baseUri = baseUri_;
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

  function setInvites(Invitelist[] calldata invitelist) external onlyOwner {
    // if (nextId == 0) nextId = 1; // delay nextId setting until the first invite is made.
    for (uint256 i = 0; i < invitelist.length; i++) {
      Invitelist calldata list = invitelist[i];
      invite[list.key] = list.invite;
      emit Invited(list.key, list.cid);
    }
  }

  function setInvite(
    bytes32 _key,
    bytes32 _cid,
    Invite calldata _invite
  ) external onlyOwner {
    // if (nextId == 0) nextId = 1; // delay nextId setting until the first invite is made.
    invite[_key] = _invite;
    emit Invited(_key, _cid);
  }

  function verify(Auth calldata auth, address account) internal pure returns (bool) {
    if (auth.key == "") return true;
    bytes32 computedHash = keccak256(abi.encodePacked(account));
    for (uint256 i = 0; i < auth.proof.length; i++) {
      bytes32 proofElement = auth.proof[i];
      if (computedHash <= proofElement) {
        computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
      } else {
        computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
      }
    }
    return computedHash == auth.key;
  }

  function _beforeTokenTransfers(
    address from,
    address to,
    uint256 startTokenId,
    uint256 quantity
  ) internal virtual override {
    super._beforeTokenTransfers(from, to, startTokenId, quantity);
  }
}
