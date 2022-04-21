// SPDX-License-Identifier: MIT
//
//        d8888                 888               888
//       d88888                 888               888
//      d88P888                 888               888
//     d88P 888 888d888 .d8888b 88888b.   .d88b.  888888 888  888 88888b.   .d88b.
//    d88P  888 888P"  d88P"    888 "88b d8P  Y8b 888    888  888 888 "88b d8P  Y8b
//   d88P   888 888    888      888  888 88888888 888    888  888 888  888 88888888
//  d8888888888 888    Y88b.    888  888 Y8b.     Y88b.  Y88b 888 888 d88P Y8b.
// d88P     888 888     "Y8888P 888  888  "Y8888   "Y888  "Y88888 88888P"   "Y8888
//                                                            888 888
//                                                       Y8b d88P 888
//                                                        "Y88P"  888

pragma solidity ^0.8.4;
import "./ERC721A-Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error MintNotYetStarted();
error WalletUnauthorizedToMint();
error InsufficientEthSent();
error ExcessiveEthSent();
error MaxSupplyExceeded();
error NumberOfMintsExceeded();
error MintingPaused();
error InvalidReferral();

error MaxBatchSizeExceeded();

contract Archetype is Initializable, ERC721AUpgradeable, OwnableUpgradeable {
  event Invited(bytes32 indexed key);
  event Withdrawal(address indexed src, uint wad);

  mapping(bytes32 => Invite) public invites;
  mapping(address => mapping(bytes32 => uint256)) private minted;
  mapping(address => uint128) public affiliateBalance;
  OwnerBalance public ownerBalance;
  struct OwnerBalance {
    uint128 owner;
    uint128 platform;
  }

  //address private constant PLATFORM = 0x60A59d7003345843BE285c15c7C78B62b61e0d7c; // REAL
  address private constant PLATFORM = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // TEST (account[2])
  uint128 public constant PLATFORM_FEE = 200; // 2%
  uint128 public constant AFFILIATE_FEE = 500; // 5%

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
    Invite invite;
  }

  function initialize(
    string memory name,
    string memory symbol,
    Config calldata config_
  ) external initializer {
    __ERC721A_init(name, symbol);
    config = config_;
    __Ownable_init();
    revealed = false;
    uriUnlocked = true;
    provenanceHashUnlocked = true;
  }

  function mint(Auth calldata auth, uint256 quantity, address affiliate, bytes calldata signature) external payable {
    Invite memory i = invites[auth.key];
    
    if(affiliate != address(0)) {
      if(affiliate==PLATFORM || affiliate==owner()) {
        revert InvalidReferral();
      }
      validateAffiliate(affiliate, signature);
    }

    if (i.limit == 0) {
      revert MintingPaused();
    }

    if (!verify(auth, _msgSender())) {
      revert WalletUnauthorizedToMint();
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted();
    }

    if (i.limit < config.maxSupply) {
      uint256 totalAfterMint = minted[_msgSender()][auth.key] + quantity;

      if (totalAfterMint > i.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if ((_currentIndex + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

    uint256 cost = i.price * quantity;
    if (msg.value < cost) {
      revert InsufficientEthSent();
    }

    if (msg.value > cost) {
      revert ExcessiveEthSent();
    }

    _safeMint(msg.sender, quantity);

    if (i.limit < config.maxSupply) {
      minted[_msgSender()][auth.key] += quantity;
    }

    uint128 value = uint128(msg.value);

    uint128 affiliateCut;
    if(affiliate != address(0)) {
      affiliateCut = (value * AFFILIATE_FEE) / 10000;
      affiliateBalance[affiliate] += affiliateCut;
    }

    OwnerBalance memory balance = ownerBalance;
    uint128 platformCut = (value * PLATFORM_FEE) / 10000;
    uint128 ownerCut = value - affiliateCut - platformCut;
    ownerBalance = OwnerBalance({
      owner: balance.owner + ownerCut,
      platform: balance.platform + platformCut
    });
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

  function withdraw(uint wad) public {
    OwnerBalance memory balance;
    uint256 maxPayout;
    if(msg.sender == owner() || msg.sender == PLATFORM) {
      balance = ownerBalance;
      if(msg.sender == owner()) {
        maxPayout = balance.owner;
      }
      else {
        maxPayout = balance.platform;
      }
    }
    else {
      maxPayout = affiliateBalance[msg.sender];
    }

    require(maxPayout >= wad, "withdraw balance too high");

    if(msg.sender == owner() || msg.sender == PLATFORM) {
      if(msg.sender == owner()) {
        ownerBalance = OwnerBalance({
          owner: balance.owner - uint128(wad),
          platform: balance.platform
        });
      }
      else {
        ownerBalance = OwnerBalance({
          owner: balance.owner,
          platform: balance.platform - uint128(wad)
        });
      }
    }
    else {
      affiliateBalance[msg.sender] -= uint128(wad);
    }

    payable(msg.sender).transfer(wad);
    emit Withdrawal(msg.sender, wad);
  }

  function setInvites(Invitelist[] calldata invitelist) external onlyOwner {
    for (uint256 i = 0; i < invitelist.length; i++) {
      Invitelist calldata list = invitelist[i];
      invites[list.key] = list.invite;
      emit Invited(list.key);
    }
  }

  function setInvite(bytes32 _key, Invite calldata _invite) external onlyOwner {
    invites[_key] = _invite;
    emit Invited(_key);
  }

  // based on: https://github.com/miguelmota/merkletreejs-solidity/blob/master/contracts/MerkleProof.sol
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

  function validateAffiliate(address affiliate, bytes memory signature) internal pure {
    bytes32 signedMessagehash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(affiliate)));
    address signer = ECDSA.recover(signedMessagehash, signature);
    if (signer != PLATFORM) {
        revert("affiliate signature verification error");
    }
  }
}
