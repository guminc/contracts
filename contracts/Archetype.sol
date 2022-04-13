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
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// error MintNotYetStarted(uint256 block, uint64 start);
error MintNotYetStarted();
// error WalletUnauthorizedToMint(address wallet, bytes32 authKey);
error WalletUnauthorizedToMint();
// error InsufficientEthSent(uint256 sent, uint256 required);
error InsufficientEthSent();
error ExcessiveEthSent();
error MaxSupplyExceeded(uint256 numRequested, uint256 numAvailable);
error NumberOfMintsExceeded();
error MintingPaused();

error MaxBatchSizeExceeded(uint256 numRequested, uint256 maxBatchSize);

contract Archetype is Initializable, ERC721AUpgradeable, OwnableUpgradeable {
  // event Invited(bytes32 indexed key, bytes32 indexed cid);
  event Invited(bytes32 indexed key);

  mapping(bytes32 => Invite) public invites;
  mapping(address => mapping(bytes32 => uint256)) private minted;

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
    uint256 maxBatchSize;
  }

  struct Invite {
    uint128 price;
    uint64 start;
    uint64 limit;
  }

  struct Invitelist {
    bytes32 key;
    // bytes32 cid;
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

    console.log("Initializing ownable upgradeable");
    __Ownable_init();
    revealed = false;
    uriUnlocked = true;
    provenanceHashUnlocked = true;
  }

  function mint(Auth calldata auth, uint256 quantity) external payable {
    Invite memory i = invites[auth.key];

    if (i.limit == 0) {
      revert MintingPaused();
    }

    if (!verify(auth, _msgSender())) {
      // revert WalletUnauthorizedToMint({ wallet: _msgSender(), authKey: auth.key });
      revert WalletUnauthorizedToMint();
    }

    console.log("i.price");
    console.log(i.price);

    if (block.timestamp < i.start) {
      console.log("we are too early");
      // revert MintNotYetStarted({ block: block.timestamp, start: i.start });
      revert MintNotYetStarted();
    }

    uint256 totalAfterMint = minted[_msgSender()][auth.key] + quantity;

    console.log("totalAfterMint");
    console.log(totalAfterMint);

    if (totalAfterMint > i.limit) {
      // revert NumberOfMintsExceeded({ totalAfterMint: totalAfterMint, limit: i.limit });
      revert NumberOfMintsExceeded();
    }

    console.log("checking maxBatchSize");
    console.log(config.maxBatchSize);

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded({ numRequested: quantity, maxBatchSize: config.maxBatchSize });
    }

    if ((_currentIndex + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded({
        numRequested: quantity,
        numAvailable: config.maxSupply - _currentIndex
      });
    }

    uint256 cost = i.price * quantity;
    if (msg.value < cost) {
      // revert InsufficientEthSent({ sent: msg.value, required: cost });
      revert InsufficientEthSent();
    }

    if (msg.value > cost) {
      revert ExcessiveEthSent();
    }

    _safeMint(msg.sender, quantity);
    minted[_msgSender()][auth.key] += quantity;
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
    uint256 cut = balance / 50;
    uint256 remainder = balance - cut;

    address scatter = 0x60A59d7003345843BE285c15c7C78B62b61e0d7c;

    payable(scatter).transfer(cut);
    payable(owner()).transfer(remainder);
  }

  function setInvites(Invitelist[] calldata invitelist) external onlyOwner {
    // if (nextId == 0) nextId = 1; // delay nextId setting until the first invite is made.
    for (uint256 i = 0; i < invitelist.length; i++) {
      Invitelist calldata list = invitelist[i];
      invites[list.key] = list.invite;
      emit Invited(list.key);
      // emit Invited(list.key, list.cid);
    }
  }

  function setInvite(
    bytes32 _key,
    // bytes32 _cid,
    Invite calldata _invite
  ) external onlyOwner {
    // if (nextId == 0) nextId = 1; // delay nextId setting until the first invite is made.
    invites[_key] = _invite;
    // emit Invited(_key, _cid);
    emit Invited(_key);
  }

  function verify(Auth calldata auth, address account) internal view returns (bool) {
    console.log("auth key");
    console.logBytes32(auth.key);

    if (auth.key == "") return true;

    console.log("verifying, auth key was not empty ");

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
}
