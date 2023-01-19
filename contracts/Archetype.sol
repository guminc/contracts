// SPDX-License-Identifier: MIT
// Archetype v0.4.1 - LAZYMINT
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

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "solady/src/utils/MerkleProofLib.sol";
import "solady/src/utils/LibString.sol";
import "solady/src/utils/ECDSA.sol";
import "closedsea/src/OperatorFilterer.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

error InvalidConfig();
error MintNotYetStarted();
error WalletUnauthorizedToMint();
error InsufficientEthSent();
error ExcessiveEthSent();
error Erc20BalanceTooLow();
error MaxSupplyExceeded();
error NumberOfMintsExceeded();
error MintingPaused();
error InvalidReferral();
error InvalidSignature();
error BalanceEmpty();
error TransferFailed();
error MaxBatchSizeExceeded();
error NotTokenOwner();
error NotPlatform();
error NotApprovedToTransfer();
error InvalidAmountOfTokens();
error WrongPassword();
error LockedForever();
error URIQueryForNonexistentToken();
error InvalidTokenId();

contract Archetype is
  Initializable,
  ERC721Upgradeable,
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
  // STRUCTS
  //
  struct Auth {
    bytes32 key;
    bytes32[] proof;
  }

  struct MintTier {
    uint16 numMints;
    uint16 mintDiscount; //BPS
  }

  struct Discount {
    uint16 affiliateDiscount; //BPS
    MintTier[] mintTiers;
  }

  struct Config {
    string baseUri;
    address affiliateSigner;
    address ownerAltPayout; // optional alternative address for owner withdrawals.
    address superAffiliatePayout; // optional super affiliate address, will receive half of platform fee if set.
    uint32 maxSupply;
    uint32 maxBatchSize;
    uint16 affiliateFee; //BPS
    uint16 platformFee; //BPS
    uint16 defaultRoyalty; //BPS
    Discount discounts;
  }

  struct Options {
    bool uriLocked;
    bool maxSupplyLocked;
    bool affiliateFeeLocked;
    bool discountsLocked;
    bool ownerAltPayoutLocked;
    bool royaltyEnforcementEnabled;
    bool royaltyEnforcementLocked;
    bool provenanceHashLocked;
  }

  struct DutchInvite {
    uint128 price;
    uint128 reservePrice;
    uint128 delta;
    uint32 start;
    uint32 limit;
    uint32 interval;
    address tokenAddress;
  }

  struct Invite {
    uint128 price;
    uint32 start;
    uint32 limit;
    address tokenAddress;
  }

  struct OwnerBalance {
    uint128 owner;
    uint128 platform;
  }

  //
  // VARIABLES
  //
  mapping(bytes32 => DutchInvite) public invites;
  mapping(address => mapping(bytes32 => uint256)) private _minted;
  mapping(address => OwnerBalance) private _ownerBalance;
  mapping(address => mapping(address => uint128)) private _affiliateBalance;
  mapping(uint256 => bytes) private _tokenMsg;

  uint256 private _totalSupply;
  Config public config;
  Options public options;

  string public provenance;

  address public constant PLATFORM = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // TEST (account[2])
  // address private constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
  uint16 private constant MAXBPS = 5000; // max fee or discount is 50%

  //
  // METHODS
  //
  function initialize(
    string memory name,
    string memory symbol,
    Config calldata config_,
    address _receiver
  ) external initializer {
    __ERC721_init(name, symbol);
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
    uint256[] calldata tokenIds,
    address affiliate,
    bytes calldata signature
  ) external payable {
    mintTo(auth, tokenIds, msg.sender, affiliate, signature);
  }

  function batchMintTo(
    Auth calldata auth,
    address[] calldata toList,
    uint256[][] calldata tokenIdsList,
    address affiliate,
    bytes calldata signature
  ) external payable {

    uint256 quantity = 0;
    for (uint256 i = 0; i < tokenIdsList.length; i++) {
      if (tokenIdsList[i].length != toList.length) {
        revert InvalidConfig();
      }
      validateMint(auth, tokenIdsList[i], affiliate, signature);

      for (uint256 j = 0; j < toList.length; j++) {
        _safeMint(toList[i], tokenIdsList[i][j]);
      }
      quantity += tokenIdsList[i].length;
    }

    DutchInvite memory invite = invites[auth.key];
    if (invite.limit < config.maxSupply) {
      _minted[msg.sender][auth.key] += quantity;
    }
    _totalSupply += quantity;
    updateBalances(auth, affiliate, quantity);
  }

  function mintTo(
    Auth calldata auth,
    uint256[] calldata tokenIds,
    address to,
    address affiliate,
    bytes calldata signature
  ) public payable {
    validateMint(auth, tokenIds, affiliate, signature);

    for (uint256 j = 0; j < tokenIds.length; j++) {
      _safeMint(to, tokenIds[j]);
    }
    DutchInvite memory i = invites[auth.key];
    uint256 quantity = tokenIds.length;
    if (i.limit < config.maxSupply) {
      _minted[msg.sender][auth.key] += quantity;
    }
    _totalSupply += quantity;
    updateBalances(auth, affiliate, quantity);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
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
    for (uint256 i = 0; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      uint128 wad = 0;

      if (msg.sender == owner() || msg.sender == config.ownerAltPayout || msg.sender == PLATFORM) {
        OwnerBalance memory balance = _ownerBalance[tokenAddress];
        if (msg.sender == owner() || msg.sender == config.ownerAltPayout) {
          wad = balance.owner;
          _ownerBalance[tokenAddress] = OwnerBalance({ owner: 0, platform: balance.platform });
        } else {
          wad = balance.platform;
          _ownerBalance[tokenAddress] = OwnerBalance({ owner: balance.owner, platform: 0 });
        }
      } else {
        wad = _affiliateBalance[msg.sender][tokenAddress];
        _affiliateBalance[msg.sender][tokenAddress] = 0;
      }

      if (wad == 0) {
        revert BalanceEmpty();
      }

      if (tokenAddress == address(0)) {
        bool success = false;
        // send to ownerAltPayout if set and owner is withdrawing
        if (msg.sender == owner() && config.ownerAltPayout != address(0)) {
          (success, ) = payable(config.ownerAltPayout).call{ value: wad }("");
        } else {
          (success, ) = msg.sender.call{ value: wad }("");
        }
        if (!success) {
          revert TransferFailed();
        }
      } else {
        IERC20Upgradeable erc20Token = IERC20Upgradeable(tokenAddress);

        if (msg.sender == owner() && config.ownerAltPayout != address(0)) {
          erc20Token.transfer(config.ownerAltPayout, wad);
        } else {
          erc20Token.transfer(msg.sender, wad);
        }
      }
      emit Withdrawal(msg.sender, tokenAddress, wad);
    }
  }

  function setTokenMsg(uint256 tokenId, string calldata message) external {
    if (msg.sender != ownerOf(tokenId)) {
      revert NotTokenOwner();
    }

    _tokenMsg[tokenId] = bytes(message);
  }

  function getTokenMsg(uint256 tokenId) external view returns (string memory) {
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
    return string(_tokenMsg[tokenId]);
  }

  // calculate price based on affiliate usage and mint discounts
  function computePrice(
    DutchInvite memory invite,
    uint256 numTokens,
    bool affiliateUsed
  ) public view returns (uint256) {

    uint256 price = invite.price;
    if(invite.interval != 0) {
      uint256 diff = (((block.timestamp - invite.start) / invite.interval) * invite.delta);
      if(price > invite.reservePrice) {
        if(diff > price - invite.reservePrice) {
          price = invite.reservePrice;
        } else {
          price = price - diff;
        }
      } 
      else if (price < invite.reservePrice) {
        if(diff > invite.reservePrice - price) {
          price = invite.reservePrice;
        } else {
          price = price + diff;
        }
      }
    }

    uint256 cost = price * numTokens;

    if (affiliateUsed) {
      cost = cost - ((cost * config.discounts.affiliateDiscount) / 10000);
    }

    for (uint256 i = 0; i < config.discounts.mintTiers.length; i++) {
      if (numTokens >= config.discounts.mintTiers[i].numMints) {
        return cost = cost - ((cost * config.discounts.mintTiers[i].mintDiscount) / 10000);
      }
    }
    return cost;
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

  function totalSupply() external view returns (uint256) { 
    return _totalSupply;
  }

  //
  // OWNER ONLY
  //

  function setBaseURI(string memory baseUri) external onlyOwner {
    if (options.uriLocked) {
      revert LockedForever();
    }

    config.baseUri = baseUri;
  }

  /// @notice the password is "forever"
  function lockURI(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.uriLocked = true;
  }

  /// @notice the password is "forever"
  // max supply cannot subceed total supply. Be careful changing.
  function setMaxSupply(uint32 maxSupply, string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    if (options.maxSupplyLocked) {
      revert LockedForever();
    }

    if (maxSupply < _totalSupply) {
      revert MaxSupplyExceeded();
    }

    config.maxSupply = maxSupply;
  }

  /// @notice the password is "forever"
  function lockMaxSupply(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.maxSupplyLocked = true;
  }

  function setAffiliateFee(uint16 affiliateFee) external onlyOwner {
    if (options.affiliateFeeLocked) {
      revert LockedForever();
    }
    if (affiliateFee > MAXBPS) {
      revert InvalidConfig();
    }

    config.affiliateFee = affiliateFee;
  }

  /// @notice the password is "forever"
  function lockAffiliateFee(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.affiliateFeeLocked = true;
  }

  function setDiscounts(Discount calldata discounts) external onlyOwner {
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
  function lockDiscounts(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.discountsLocked = true;
  }

  /// @notice Set BAYC-style provenance once it's calculated
  function setProvenanceHash(string memory provenanceHash) external onlyOwner {
    if (options.provenanceHashLocked) {
      revert LockedForever();
    }

    provenance = provenanceHash;
  }

  /// @notice the password is "forever"
  function lockProvenanceHash(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.provenanceHashLocked = true;
  }

  function setOwnerAltPayout(address ownerAltPayout) external onlyOwner {
    if (options.ownerAltPayoutLocked) {
      revert LockedForever();
    }

    config.ownerAltPayout = ownerAltPayout;
  }

  /// @notice the password is "forever"
  function lockOwnerAltPayout(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.ownerAltPayoutLocked = true;
  }

  function setMaxBatchSize(uint32 maxBatchSize) external onlyOwner {
    config.maxBatchSize = maxBatchSize;
  }


  function setInvite(
    bytes32 _key,
    bytes32 _cid,
    Invite calldata _invite
  ) external onlyOwner {
    invites[_key] = DutchInvite({
      price: _invite.price,
      reservePrice: _invite.price,
      delta: 0,
      start: _invite.start,
      limit: _invite.limit,
      interval: 0,
      tokenAddress: _invite.tokenAddress
    });
    emit Invited(_key, _cid);
  }

  function setDutchInvite(
    bytes32 _key,
    bytes32 _cid,
    DutchInvite memory _dutchInvite
  ) external onlyOwner {
    if (_dutchInvite.start < block.timestamp) {
      _dutchInvite.start = uint32(block.timestamp);
    }
    invites[_key] = _dutchInvite;
    emit Invited(_key, _cid);
  }

  //
  // PLATFORM ONLY
  //
  function setSuperAffiliatePayout(address superAffiliatePayout) external onlyPlatform {
    config.superAffiliatePayout = superAffiliatePayout;
  }

  //
  // INTERNAL
  //
  function _startTokenId() internal view virtual returns (uint256) {
    return 1;
  }

  function updateBalances(
    Auth calldata auth,
    address affiliate,
    uint256 quantity
  ) internal {
    DutchInvite memory i = invites[auth.key];
    address tokenAddress = i.tokenAddress;
    uint128 value = uint128(msg.value);
    if (tokenAddress != address(0)) {
      value = uint128(computePrice(i, quantity, affiliate != address(0)));
    }

    uint128 affiliateWad = 0;
    if (affiliate != address(0)) {
      affiliateWad = (value * config.affiliateFee) / 10000;
      _affiliateBalance[affiliate][tokenAddress] += affiliateWad;
      emit Referral(affiliate, tokenAddress, affiliateWad, quantity);
    }

    uint128 superAffiliateWad = 0;
    if (config.superAffiliatePayout != address(0)) {
      superAffiliateWad = ((value * config.platformFee) / 2) / 10000;
      _affiliateBalance[config.superAffiliatePayout][tokenAddress] += superAffiliateWad;
    }

    OwnerBalance memory balance = _ownerBalance[tokenAddress];
    uint128 platformWad = ((value * config.platformFee) / 10000) - superAffiliateWad;
    uint128 ownerWad = value - affiliateWad - platformWad - superAffiliateWad;
    _ownerBalance[tokenAddress] = OwnerBalance({
      owner: balance.owner + ownerWad,
      platform: balance.platform + platformWad
    });

    if (tokenAddress != address(0)) {
      IERC20Upgradeable erc20Token = IERC20Upgradeable(tokenAddress);
      erc20Token.transferFrom(msg.sender, address(this), value);
    }
  }

  function validateMint(
    Auth calldata auth,
    uint256[] calldata tokenIds,
    address affiliate,
    bytes calldata signature
  ) internal view {
    DutchInvite memory i = invites[auth.key];
    uint256 quantity = tokenIds.length;

    if (affiliate != address(0)) {
      if (affiliate == PLATFORM || affiliate == owner() || affiliate == msg.sender) {
        revert InvalidReferral();
      }
      validateAffiliate(affiliate, signature, config.affiliateSigner);
    }

    if (i.limit == 0) {
      revert MintingPaused();
    }

    if (!verify(auth, i.tokenAddress, msg.sender)) {
      revert WalletUnauthorizedToMint();
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted();
    }

    if (i.limit < config.maxSupply) {
      uint256 totalAfterMint = _minted[msg.sender][auth.key] + quantity;

      if (totalAfterMint > i.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if ((_totalSupply + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

    for (uint256 j = 0; j < tokenIds.length; j++) {
      if (tokenIds[j] < _startTokenId() || tokenIds[j] > config.maxSupply) {
        revert InvalidTokenId();
      }
    }


    uint256 cost = computePrice(i, quantity, affiliate != address(0));

    if (i.tokenAddress != address(0)) {
      IERC20Upgradeable erc20Token = IERC20Upgradeable(i.tokenAddress);
      if (erc20Token.allowance(msg.sender, address(this)) < cost) {
        revert NotApprovedToTransfer();
      }

      if (erc20Token.balanceOf(msg.sender) < cost) {
        revert Erc20BalanceTooLow();
      }

      if (msg.value != 0) {
        revert ExcessiveEthSent();
      }
    } else {
      if (msg.value < cost) {
        revert InsufficientEthSent();
      }

      if (msg.value > cost) {
        revert ExcessiveEthSent();
      }
    }
  }

  function validateAffiliate(
    address affiliate,
    bytes calldata signature,
    address affiliateSigner
  ) internal view {
    bytes32 signedMessagehash = ECDSA.toEthSignedMessageHash(
      keccak256(abi.encodePacked(affiliate))
    );
    address signer = ECDSA.recover(signedMessagehash, signature);

    if (signer != affiliateSigner) {
      revert InvalidSignature();
    }
  }

  function verify(
    Auth calldata auth,
    address tokenAddress,
    address account
  ) internal pure returns (bool) {
    if (auth.key == "" || auth.key == keccak256(abi.encodePacked(tokenAddress))) {
      return true;
    }

    return MerkleProofLib.verify(auth.proof, auth.key, keccak256(abi.encodePacked(account)));
  }

  modifier onlyPlatform() {
    if (msg.sender != PLATFORM) {
      revert NotPlatform();
    }
    _;
  }

  // OPTIONAL ROYALTY ENFORCEMENT WITH OPENSEA
  function enableRoyaltyEnforcement() external onlyOwner {
    if (options.royaltyEnforcementLocked) {
      revert LockedForever();
    }
    _registerForOperatorFiltering();
    options.royaltyEnforcementEnabled = true;
  }

  function disableRoyaltyEnforcement() external onlyOwner {
    if (options.royaltyEnforcementLocked) {
      revert LockedForever();
    }
    options.royaltyEnforcementEnabled = false;
  }

  /// @notice the password is "forever"
  function lockRoyaltyEnforcement(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    options.royaltyEnforcementLocked = true;
  }

  function setApprovalForAll(address operator, bool approved)
    public
    override
    onlyAllowedOperatorApproval(operator)
  {
    super.setApprovalForAll(operator, approved);
  }

  function approve(address operator, uint256 tokenId)
    public
    override
    onlyAllowedOperatorApproval(operator)
  {
    super.approve(operator, tokenId);
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override onlyAllowedOperator(from) {
    super.transferFrom(from, to, tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override onlyAllowedOperator(from) {
    super.safeTransferFrom(from, to, tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public override onlyAllowedOperator(from) {
    super.safeTransferFrom(from, to, tokenId, data);
  }

  function _operatorFilteringEnabled() internal view override returns (bool) {
    return options.royaltyEnforcementEnabled;
  }

  //ERC2981 ROYALTY
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721Upgradeable, ERC2981Upgradeable)
    returns (bool)
  {
    // Supports the following `interfaceId`s:
    // - IERC165: 0x01ffc9a7
    // - IERC721: 0x80ac58cd
    // - IERC721Metadata: 0x5b5e139f
    // - IERC2981: 0x2a55205a
    return
      ERC721Upgradeable.supportsInterface(interfaceId) ||
      ERC2981Upgradeable.supportsInterface(interfaceId);
  }

  function setDefaultRoyalty(address receiver, uint16 feeNumerator) public onlyOwner {
    config.defaultRoyalty = feeNumerator;
    _setDefaultRoyalty(receiver, feeNumerator);
  }
}
