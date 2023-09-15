// SPDX-License-Identifier: MIT
// Archetype v0.6.0 - ERC1155-Random
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

import "./ArchetypeLogic.sol";
import "./VRFConsumerBaseV2Upgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "solady/src/utils/LibString.sol";
import "closedsea/src/OperatorFilterer.sol";

contract Archetype is
  Initializable,
  ERC1155Upgradeable,
  VRFConsumerBaseV2Upgradeable,
  OperatorFilterer,
  OwnableUpgradeable,
  ERC2981Upgradeable
{
  //
  // EVENTS
  //
  event Invited(bytes32 indexed key, bytes32 indexed cid);
  event Referral(address indexed affiliate, address token, uint128 wad, uint256 numMints);
  event Withdrawal(address indexed src, address token, uint128 wad);

  //
  // VARIABLES
  //
  mapping(bytes32 => DutchInvite) public invites;
  mapping(address => mapping(bytes32 => uint256)) private _minted;
  mapping(bytes32 => uint256) private _listSupply;
  mapping(address => OwnerBalance) private _ownerBalance;
  mapping(address => mapping(address => uint128)) private _affiliateBalance;

  uint256[] private _tokenSupply;

  Config public config;
  Options public options;

  string public name;
  string public symbol;
  string public provenance;

  // chainlink
  bytes32 internal keyHash;
  uint256 internal fee;
  VRFCoordinatorV2Interface internal vrfCoordinator;
  mapping(uint256 => VrfMintInfo) public requestIdMintInfo;

  //
  // METHODS
  //
  function initialize(
    string memory _name,
    string memory _symbol,
    Config calldata config_,
    address _receiver
  ) external initializer {
    name = _name;
    symbol = _symbol;
    __ERC1155_init("");

    __VRFConsumerBaseV2Upgradeable_init(
      VRF_CORDINATOR
    );
    vrfCoordinator = VRFCoordinatorV2Interface(VRF_CORDINATOR);
    keyHash = 0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186;
    fee = 0.1 * 10 ** 18; 

    // check max bps not reached and min platform fee.
    if (
      config_.affiliateFee > MAXBPS ||
      config_.platformFee > MAXBPS ||
      config_.platformFee < 500 ||
      config_.discounts.affiliateDiscount > MAXBPS ||
      config_.affiliateSigner == address(0) ||
      config_.maxBatchSize == 0
    ) {
      revert InvalidConfig();
    }
    // ensure mint tiers are correctly ordered from highest to lowest.
    for (uint256 i = 1; i < config_.discounts.mintTiers.length; i++) {
      if (
        config_.discounts.mintTiers[i].mintDiscount > MAXBPS ||
        config_.discounts.mintTiers[i].numMints > config_.discounts.mintTiers[i - 1].numMints
      ) {
        revert InvalidConfig();
      }
    }
    uint16 maxToken = _findMax(config_.tokenPool);
    _tokenSupply = new uint256[](maxToken + 1);
    config = config_;
    __Ownable_init();

    if (config.ownerAltPayout != address(0)) {
      setDefaultRoyalty(config.ownerAltPayout, config.defaultRoyalty);
    } else {
      setDefaultRoyalty(_receiver, config.defaultRoyalty);
    }
  }

  //
  // PUBLIC
  //

  function mint(
    Auth calldata auth,
    uint256 quantity,
    address affiliate,
    bytes calldata signature
  ) external payable {
    mintTo(auth, quantity, _msgSender(), affiliate, signature);
  }

  function mintTo(
    Auth calldata auth,
    uint256 quantity,
    address to,
    address affiliate,
    bytes calldata signature
  ) public payable {
    DutchInvite storage i = invites[auth.key];

    if (i.unitSize > 1) {
      quantity = quantity * i.unitSize;
    }

    ValidationArgs memory args = ValidationArgs({
        owner: owner(),
        affiliate: affiliate,
        quantity: quantity
    });

    ArchetypeLogic.validateMint(
      i,
      config,
      auth,
      _minted,
      _listSupply,
      signature,
      args
    );

    if(options.useChainlinkVRF) {
        uint256 requestId = requestRandomness(); // Assuming this function internally requests randomness from Chainlink VRF
        requestIdMintInfo[requestId] = VrfMintInfo({
          to: to,
          quantity: quantity
        });
    } else {
      uint16[] memory tokenIds;
      uint256 seed = ArchetypeLogic.random();
      tokenIds = ArchetypeLogic.getRandomTokenIds(
        config.tokenPool,
        quantity,
        seed
      );

      for (uint256 j = 0; j < tokenIds.length; j++) {
        bytes memory _data;
        _mint(to, tokenIds[j], 1, _data);
        _tokenSupply[tokenIds[j]] += 1;
        // TODO: Analyze tradeoff of keeping this tokenSupply, we do not need it for validation
        // Pros: on chain supply tracking, Cons: Extra storage write every mint
      }
    }

    if (i.limit < i.maxSupply) {
      _minted[_msgSender()][auth.key] += quantity;
    }
    if (i.maxSupply < 2**32 - 1) {
      _listSupply[auth.key] += quantity;
    }

    ArchetypeLogic.updateBalances(i, config, _ownerBalance, _affiliateBalance, affiliate, quantity);
  }

  function uri(uint256 tokenId) public view override returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
    return
      bytes(config.baseUri).length != 0
        ? string(abi.encodePacked(config.baseUri, LibString.toString(tokenId)))
        : "";
  }

  function withdraw() external {
    address[] memory tokens = new address[](1);
    tokens[0] = address(0);
    withdrawTokens(tokens);
  }

  function withdrawTokens(address[] memory tokens) public {
    ArchetypeLogic.withdrawTokens(config, _ownerBalance, _affiliateBalance, owner(), tokens);
  }

  function ownerBalance() external view returns (OwnerBalance memory) {
    return _ownerBalance[address(0)];
  }

  function ownerBalanceToken(address token) external view returns (OwnerBalance memory) {
    return _ownerBalance[token];
  }

  function affiliateBalance(address affiliate) external view returns (uint128) {
    return _affiliateBalance[affiliate][address(0)];
  }

  function affiliateBalanceToken(address affiliate, address token) external view returns (uint128) {
    return _affiliateBalance[affiliate][token];
  }

  function minted(address minter, bytes32 key) external view returns (uint256) {
    return _minted[minter][key];
  }

  function listSupply(bytes32 key) external view returns (uint256) {
    return _listSupply[key];
  }

  function platform() external pure returns (address) {
    return PLATFORM;
  }

  function tokenSupply(uint256 tokenId) external view returns (uint256) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
    return _tokenSupply[tokenId - 1];
  }

  function totalSupply() external view returns (uint256) {
    uint256 supply = 0;
    for (uint256 i = 0; i < _tokenSupply.length; i++) {
      supply += _tokenSupply[i];
    }
    return supply;
  }

  function tokenPool() external view returns (uint16[] memory) {
    return config.tokenPool;
  }

  function computePrice(
    bytes32 key,
    uint256 quantity,
    bool affiliateUsed
  ) external view returns (uint256) {
    DutchInvite storage i = invites[key];
    return ArchetypeLogic.computePrice(i, config.discounts, quantity, affiliateUsed);
  }

  //
  // OWNER ONLY
  //

  function setBaseURI(string memory baseUri) external _onlyOwner {
    if (options.uriLocked) {
      revert LockedForever();
    }

    config.baseUri = baseUri;
  }

  /// @notice the password is "forever"
  function lockURI(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.uriLocked = true;
  }

  /// @notice the password is "forever"
  // token supply cannot be decreased once minted. Be careful changing.
  function updateTokenPool(uint16[] memory newTokens, string memory password) public _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    if (options.tokenPoolLocked) {
      revert LockedForever();
    }

    uint16 maxToken = _findMax(newTokens);

    for (uint256 i = 0; i < newTokens.length; i++) {
      config.tokenPool.push(newTokens[i]);
    }

    // increase size of token supply array to match new max token
    for (uint256 i = _tokenSupply.length; i <= maxToken; i++) {
      _tokenSupply.push(0);
    }
  }

  /// @notice the password is "forever"
  // token supply will be reset and contents will be lost forever. Be careful changing.
  function resetTokenPool(uint16[] memory newTokens, string memory password) external _onlyOwner {
    delete config.tokenPool;
    updateTokenPool(newTokens, password);
  }

  /// @notice the password is "forever"
  function lockTokenPool(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.tokenPoolLocked = true;
  }

  function setAffiliateFee(uint16 affiliateFee) external _onlyOwner {
    if (options.affiliateFeeLocked) {
      revert LockedForever();
    }
    if (affiliateFee > MAXBPS) {
      revert InvalidConfig();
    }

    config.affiliateFee = affiliateFee;
  }

  /// @notice the password is "forever"
  function lockAffiliateFee(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.affiliateFeeLocked = true;
  }

  function setDiscounts(Discount calldata discounts) external _onlyOwner {
    if (options.discountsLocked) {
      revert LockedForever();
    }

    if (discounts.affiliateDiscount > MAXBPS) {
      revert InvalidConfig();
    }

    // ensure mint tiers are correctly ordered from highest to lowest.
    for (uint256 i = 1; i < discounts.mintTiers.length; i++) {
      if (
        discounts.mintTiers[i].mintDiscount > MAXBPS ||
        discounts.mintTiers[i].numMints > discounts.mintTiers[i - 1].numMints
      ) {
        revert InvalidConfig();
      }
    }

    config.discounts = discounts;
  }

  /// @notice the password is "forever"
  function lockDiscounts(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.discountsLocked = true;
  }

  /// @notice Set BAYC-style provenance once it's calculated
  function setProvenanceHash(string memory provenanceHash) external _onlyOwner {
    if (options.provenanceHashLocked) {
      revert LockedForever();
    }

    provenance = provenanceHash;
  }

  /// @notice the password is "forever"
  function lockProvenanceHash(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.provenanceHashLocked = true;
  }

  function setOwnerAltPayout(address ownerAltPayout) external _onlyOwner {
    if (options.ownerAltPayoutLocked) {
      revert LockedForever();
    }

    config.ownerAltPayout = ownerAltPayout;
  }

  /// @notice the password is "forever"
  function lockOwnerAltPayout(string memory password) external _onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }
    options.ownerAltPayoutLocked = true;
  }

  function setMaxBatchSize(uint16 maxBatchSize) external _onlyOwner {
    config.maxBatchSize = maxBatchSize;
  }

  function useChainlinkVRF() external _onlyOwner {
    options.useChainlinkVRF = !options.useChainlinkVRF;
  }

  function setInvite(
    bytes32 _key,
    bytes32 _cid,
    Invite calldata _invite
  ) external _onlyOwner {
    invites[_key] = DutchInvite({
      price: _invite.price,
      reservePrice: _invite.price,
      delta: 0,
      start: _invite.start,
      end: _invite.end,
      limit: _invite.limit,
      maxSupply: _invite.maxSupply,
      interval: 0,
      unitSize: _invite.unitSize,
      tokenIds: _invite.tokenIds,
      tokenAddress: _invite.tokenAddress
    });
    emit Invited(_key, _cid);
  }

  function setDutchInvite(
    bytes32 _key,
    bytes32 _cid,
    DutchInvite memory _dutchInvite
  ) external _onlyOwner {
    if (_dutchInvite.start < block.timestamp) {
      _dutchInvite.start = uint32(block.timestamp);
    }
    invites[_key] = _dutchInvite;
    emit Invited(_key, _cid);
  }

  //
  // PLATFORM ONLY
  //
  function setSuperAffiliatePayout(address superAffiliatePayout) external _onlyPlatform {
    config.superAffiliatePayout = superAffiliatePayout;
  }

  //
  // INTERNAL
  //
  function _startTokenId() internal view virtual returns (uint256) {
    return 1;
  }

  function _exists(uint256 tokenId) internal view returns (bool) {
    return tokenId > 0 && tokenId <= _tokenSupply.length;
  }

  function _findMax(uint16[] memory _tokenPool) internal pure returns (uint16) {
    uint16 maxToken;
    for (uint256 i = 0; i < _tokenPool.length; i++) {
      if (_tokenPool[i] > maxToken) {
          maxToken = _tokenPool[i];
      }
    }
    return maxToken;
  }

  function _msgSender() internal view override returns (address) {
    return msg.sender == BATCH? tx.origin: msg.sender;
  }

  function _isOwner() internal view {
    if (_msgSender() != owner()) {
      revert NotOwner();
    }  
  }

  // Request randomness
  function requestRandomness() internal returns (uint256 requestId) {
      if(IERC20Upgradeable(LINK).balanceOf(address(this)) < fee) {
        revert InsufficientLink();
      }

      uint16 minimumRequestConfirmations = 5;  // reaccess
      uint32 callbackGasLimit = 200000;  // adjust based on testing

      // Requesting the random numbers
      requestId = vrfCoordinator.requestRandomWords(
          keyHash,
          1,
          1,
          minimumRequestConfirmations,
          callbackGasLimit
      );
  }

  // Callback function used by VRF Coordinator
  function fulfillRandomWords(uint256 requestId, uint256[] memory randomness) internal override {        
    VrfMintInfo memory mintInfo = requestIdMintInfo[requestId];
    uint16[] memory tokenIds;
    tokenIds = ArchetypeLogic.getRandomTokenIds(
      config.tokenPool,
      mintInfo.quantity,
      randomness[0]
    );

    for (uint256 j = 0; j < tokenIds.length; j++) {
      bytes memory _data;
      _mint(mintInfo.to, tokenIds[j], 1, _data);
      _tokenSupply[tokenIds[j]] += 1;
      // TODO: Analyze tradeoff of keeping this tokenSupply, we do not need it for validation
      // Pros: on chain supply tracking, Cons: Extra storage write every mint
    }
  }

  modifier _onlyPlatform() {
    if (_msgSender() != PLATFORM) {
      revert NotPlatform();
    }
    _;
  }
  
  // modifier _onlyVrf() {
  //   if (_msgSender() != VRF_CORDINATOR) {
  //     revert NotVRF();
  //   }
  //   _;
  // }

  modifier _onlyOwner() {
    _isOwner();
    _;
  }

  //ERC2981 ROYALTY
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC1155Upgradeable, ERC2981Upgradeable)
    returns (bool)
  {
    // Supports the following `interfaceId`s:
    // - IERC165: 0x01ffc9a7
    // - IERC721: 0x80ac58cd
    // - IERC721Metadata: 0x5b5e139f
    // - IERC2981: 0x2a55205a
    return
      ERC1155Upgradeable.supportsInterface(interfaceId) ||
      ERC2981Upgradeable.supportsInterface(interfaceId);
  }

  function setDefaultRoyalty(address receiver, uint16 feeNumerator) public _onlyOwner {
    config.defaultRoyalty = feeNumerator;
    _setDefaultRoyalty(receiver, feeNumerator);
  }
}
