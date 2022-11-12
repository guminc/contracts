// SPDX-License-Identifier: MIT
// Archetype v0.3.3
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
import "solady/src/utils/MerkleProofLib.sol";
import "solady/src/utils/LibString.sol";
import "solady/src/utils/ECDSA.sol";
import "hardhat/console.sol";

error InvalidConfig();
error MintNotYetStarted();
error WalletUnauthorizedToMint();
error InsufficientEthSent();
error ExcessiveEthSent();
error MaxSupplyExceeded();
error NumberOfMintsExceeded();
error MintingPaused();
error InvalidReferral();
error InvalidSignature();
error BalanceEmpty();
error TransferFailed();
error MaxBatchSizeExceeded();
error BurnToMintDisabled();
error NotTokenOwner();
error NotApprovedToTransfer();
error InvalidAmountOfTokens();
error WrongPassword();
error LockedForever();

contract ArchetypeAirDrop is ERC721Upgradeable, OwnableUpgradeable {
  //
  // EVENTS
  //
  event Invited(bytes32 indexed key, bytes32 indexed cid);
  event Referral(address indexed affiliate, uint128 wad, uint256 numMints);
  event Withdrawal(address indexed src, uint128 wad);

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
    string unrevealedUri;
    string baseUri;
    address affiliateSigner;
    address ownerAltPayout; // optional alternative address for owner withdrawals.
    address superAffiliatePayout; // optional super affiliate address, will receive half of platform fee if set.
    uint32 maxSupply;
    uint32 maxBatchSize;
    uint16 affiliateFee; //BPS
    uint16 platformFee; //BPS
    Discount discounts;
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

  struct OwnerBalance {
    uint128 owner;
    uint128 platform;
  }

  struct BurnConfig {
    ArchetypeAirDrop archetype;
    bool enabled;
    uint16 ratio;
    uint64 start;
    uint64 limit;
  }

  //
  // VARIABLES
  //
  mapping(bytes32 => Invite) public invites;
  mapping(address => mapping(bytes32 => uint256)) private minted;
  mapping(address => uint128) public affiliateBalance;
  mapping(uint256 => bytes) private tokenMsg;

  OwnerBalance public ownerBalance;
  Config public config;
  BurnConfig public burnConfig;

  bool public revealed;
  bool public uriUnlocked;
  bool public maxSupplyUnlocked;
  bool public affiliateFeeUnlocked;
  bool public discountsUnlocked;
  bool public ownerAltPayoutUnlocked;
  bool public provenanceHashUnlocked;
  string public provenance;
  uint256 private tokenIdCounter;


  // address private constant PLATFORM = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // TEST (account[2])
  address private constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
  uint16 private constant MAXBPS = 5000; // max fee or discount is 50%

  uint32 private constant AIRDROP_COUNT = 200;

  //
  // METHODS
  //
  function initialize(
    string memory name,
    string memory symbol,
    Config calldata config_
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
    revealed = true;
    uriUnlocked = true;
    maxSupplyUnlocked = true;
    affiliateFeeUnlocked = true;
    discountsUnlocked = true;
    ownerAltPayoutUnlocked = true;
    provenanceHashUnlocked = true;
    tokenIdCounter = 1;

    // AIR DROP TOKENS
    address[AIRDROP_COUNT] memory airdropList = getAirDropList();
    uint256 startTokenId = tokenIdCounter;
    uint256 endTokenId = airdropList.length + startTokenId;
    for (uint256 i = startTokenId; i < endTokenId; i++) {
      emit Transfer(address(0x0), airdropList[i-1], i);
    }
    tokenIdCounter = endTokenId;
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
    mintTo(auth, quantity, msg.sender, affiliate, signature);
  }

  function mintTo(
    Auth calldata auth,
    uint256 quantity,
    address to,
    address affiliate,
    bytes calldata signature
  ) public payable {
    Invite memory i = invites[auth.key];

    if (to == address(0)) {
      to = msg.sender;
    }

    if (affiliate != address(0)) {
      if (affiliate == PLATFORM || affiliate == owner() || affiliate == msg.sender) {
        revert InvalidReferral();
      }
      validateAffiliate(affiliate, signature, config.affiliateSigner);
    }

    if (i.limit == 0) {
      revert MintingPaused();
    }

    if (!verify(auth, msg.sender)) {
      revert WalletUnauthorizedToMint();
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted();
    }

    if (i.limit < config.maxSupply) {
      uint256 totalAfterMint = minted[msg.sender][auth.key] + quantity;

      if (totalAfterMint > i.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if ((totalSupply() + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

    uint256 cost = computePrice(i.price, quantity, affiliate != address(0));

    if (msg.value < cost) {
      revert InsufficientEthSent();
    }

    if (msg.value > cost) {
      revert ExcessiveEthSent();
    }

    uint256 startTokenId = tokenIdCounter;
    uint256 endTokenId = quantity + startTokenId;
    for (uint256 id = startTokenId; id < endTokenId; id++) {
      _mint(to, id);
    }
    tokenIdCounter = endTokenId;

    if (i.limit < config.maxSupply) {
      minted[msg.sender][auth.key] += quantity;
    }

    uint128 value = uint128(msg.value);

    uint128 affiliateWad = 0;
    if (affiliate != address(0)) {
      affiliateWad = (value * config.affiliateFee) / 10000;
      affiliateBalance[affiliate] += affiliateWad;
      emit Referral(affiliate, affiliateWad, quantity);
    }

    uint128 superAffiliateWad = 0;
    if (config.superAffiliatePayout != address(0)) {
      superAffiliateWad = ((value * config.platformFee) / 2) / 10000;
      affiliateBalance[config.superAffiliatePayout] += superAffiliateWad;
    }

    OwnerBalance memory balance = ownerBalance;
    uint128 platformWad = ((value * config.platformFee) / 10000) - superAffiliateWad;
    uint128 ownerWad = value - affiliateWad - platformWad - superAffiliateWad;
    ownerBalance = OwnerBalance({
      owner: balance.owner + ownerWad,
      platform: balance.platform + platformWad
    });
  }

  function burnToMint(uint256[] calldata tokenIds) external {
    if (!burnConfig.enabled) {
      revert BurnToMintDisabled();
    }

    if (block.timestamp < burnConfig.start) {
      revert MintNotYetStarted();
    }

    // check if msg.sender owns tokens and has correct approvals
    for (uint256 i = 0; i < tokenIds.length; i++) {
      if (burnConfig.archetype.ownerOf(tokenIds[i]) != msg.sender) {
        revert NotTokenOwner();
      }
    }

    if (!burnConfig.archetype.isApprovedForAll(msg.sender, address(this))) {
      revert NotApprovedToTransfer();
    }

    if (tokenIds.length % burnConfig.ratio != 0) {
      revert InvalidAmountOfTokens();
    }

    uint256 quantity = tokenIds.length / burnConfig.ratio;

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if (burnConfig.limit < config.maxSupply) {
      uint256 totalAfterMint = minted[msg.sender][bytes32("burn")] + quantity;

      if (totalAfterMint > burnConfig.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if ((totalSupply() + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

    for (uint256 i = 0; i < tokenIds.length; i++) {
      burnConfig.archetype.transferFrom(
        msg.sender,
        address(0x000000000000000000000000000000000000dEaD),
        tokenIds[i]
      );
    }
    uint256 startTokenId = tokenIdCounter;
    uint256 endTokenId = quantity + startTokenId;
    for (uint256 id = startTokenId; id < endTokenId; id++) {
      _mint(msg.sender, id);
    }
    tokenIdCounter = endTokenId;

    if (burnConfig.limit < config.maxSupply) {
      minted[msg.sender][bytes32("burn")] += quantity;
    }
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!_exists(tokenId)) return "";

    if (revealed == false) {
      return string(abi.encodePacked(config.unrevealedUri, LibString.toString(tokenId)));
    }

    return
      bytes(config.baseUri).length != 0
        ? string(abi.encodePacked(config.baseUri, LibString.toString(tokenId)))
        : "";
  }

  function withdraw() external {
    uint128 wad = 0;

    if (msg.sender == owner() || msg.sender == config.ownerAltPayout || msg.sender == PLATFORM) {
      OwnerBalance memory balance = ownerBalance;
      if (msg.sender == owner() || msg.sender == config.ownerAltPayout) {
        wad = balance.owner;
        ownerBalance = OwnerBalance({ owner: 0, platform: balance.platform });
      } else {
        wad = balance.platform;
        ownerBalance = OwnerBalance({ owner: balance.owner, platform: 0 });
      }
    } else {
      wad = affiliateBalance[msg.sender];
      affiliateBalance[msg.sender] = 0;
    }

    if (wad == 0) {
      revert BalanceEmpty();
    }
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
    emit Withdrawal(msg.sender, wad);
  }

  function setTokenMsg(uint256 tokenId, string calldata message) external {
    if (msg.sender != ownerOf(tokenId)) {
      revert NotTokenOwner();
    }

    tokenMsg[tokenId] = bytes(message);
  }

  function getTokenMsg(uint256 tokenId) external view returns (string memory) {
    return string(tokenMsg[tokenId]);
  }

  // calculate price based on affiliate usage and mint discounts
  function computePrice(
    uint128 price,
    uint256 numTokens,
    bool affiliateUsed
  ) public view returns (uint256) {
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

    function totalSupply() public view returns (uint256) {
        return tokenIdCounter - 1;
    }

  //
  // OWNER ONLY
  //
  function reveal() external onlyOwner {
    revealed = !revealed;
  }

  function setUnrevealedURI(string memory unrevealedURI) external onlyOwner {
    config.unrevealedUri = unrevealedURI;
  }

  function setBaseURI(string memory baseUri) external onlyOwner {
    if (!uriUnlocked) {
      revert LockedForever();
    }

    config.baseUri = baseUri;
  }

  /// @notice the password is "forever"
  function lockURI(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    uriUnlocked = false;
  }

  /// @notice the password is "forever"
  // max supply cannot subceed total supply. Be careful changing.
  function setMaxSupply(uint32 maxSupply, string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }
    
    if (!maxSupplyUnlocked) {
      revert LockedForever();
    }

    if (maxSupply < totalSupply()) {
      revert MaxSupplyExceeded();
    }

    config.maxSupply = maxSupply;
  }

  /// @notice the password is "forever"
  function lockMaxSupply(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    maxSupplyUnlocked = false;
  }

  function setAffiliateFee(uint16 affiliateFee) external onlyOwner {
    if (!affiliateFeeUnlocked) {
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

    affiliateFeeUnlocked = false;
  }

  function setDiscounts(Discount calldata discounts) external onlyOwner {
    if (!discountsUnlocked) {
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

    discountsUnlocked = false;
  }

  /// @notice Set BAYC-style provenance once it's calculated
  function setProvenanceHash(string memory provenanceHash) external onlyOwner {
    if (!provenanceHashUnlocked) {
      revert LockedForever();
    }

    provenance = provenanceHash;
  }

  /// @notice the password is "forever"
  function lockProvenanceHash(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    provenanceHashUnlocked = false;
  }

  function setOwnerAltPayout(address ownerAltPayout) external onlyOwner {
    if (!ownerAltPayoutUnlocked) {
      revert LockedForever();
    }

    config.ownerAltPayout = ownerAltPayout;
  }

  /// @notice the password is "forever"
  function lockOwnerAltPayout(string memory password) external onlyOwner {
    if (keccak256(abi.encodePacked(password)) != keccak256(abi.encodePacked("forever"))) {
      revert WrongPassword();
    }

    ownerAltPayoutUnlocked = false;
  }

  function setInvites(Invitelist[] calldata invitelist) external onlyOwner {
    for (uint256 i = 0; i < invitelist.length; i++) {
      Invitelist calldata list = invitelist[i];
      invites[list.key] = list.invite;
      emit Invited(list.key, list.cid);
    }
  }

  function setInvite(
    bytes32 _key,
    bytes32 _cid,
    Invite calldata _invite
  ) external onlyOwner {
    invites[_key] = _invite;
    emit Invited(_key, _cid);
  }

  function enableBurnToMint(
    address archetype,
    uint16 ratio,
    uint64 start,
    uint64 limit
  ) external onlyOwner {
    burnConfig = BurnConfig({
      archetype: ArchetypeAirDrop(archetype),
      enabled: true,
      ratio: ratio,
      start: start,
      limit: limit
    });
  }

  function disableBurnToMint() external onlyOwner {
    burnConfig = BurnConfig({
      enabled: false,
      ratio: 0,
      archetype: ArchetypeAirDrop(address(0)),
      start: 0,
      limit: 0
    });
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

  function getAirDropList() internal pure returns (address[AIRDROP_COUNT] memory){
    // USE FOR TESTS
    // address[AIRDROP_COUNT] memory airdropList = [
    //   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
    //   0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
    //   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
    //   0x90F79bf6EB2c4f870365E785982E1f101E93b906,
    //   0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,
    //   0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc,
    //   0x976EA74026E726554dB657fA54763abd0C3a0aa9,
    //   0x14dC79964da2C08b23698B3D3cc7Ca32193d9955,
    //   0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f,
    //   0xa0Ee7A142d267C1f36714E4a8F75612F20a79720,
    //   0xBcd4042DE499D14e55001CcbB24a551F3b954096,
    //   0x71bE63f3384f5fb98995898A86B02Fb2426c5788,
    //   0xFABB0ac9d68B0B445fB7357272Ff202C5651694a,
    //   0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec,
    //   0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097,
    //   0xcd3B766CCDd6AE721141F452C550Ca635964ce71,
    //   0x2546BcD3c84621e976D8185a91A922aE77ECEc30,
    //   0xbDA5747bFD65F08deb54cb465eB87D40e51B197E,
    //   0xdD2FD4581271e230360230F9337D5c0430Bf44C0,
    //   0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
    // ];
    address[AIRDROP_COUNT] memory airdropList = [
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      0xC46bfD225AD359f78C7fE84D50619977c6B7f318,
      0xeBD49C5623e91F6618912c92b4c5Bf25AcD87a31,
      0x812DbB12a51a5173cBAE829dD451CD4A79f6a756,
      0x20D35924B3aE9111Cd1986f426D82758eB1767FB,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xA0506d623Ea4ccE494f38C25b1Ff47E823B120F9,
      0x53Ae2B3505B8eA5469Cca95f8c38906BB7122667,
      0x8FdC9054B4D893673C979163E4bc9aAc5DFe91A3,
      0x7522eD9920627e78b166fbA7D08e0c44E01D1Ed9,
      0x6ddB0a7fb27999883b0aaFD1B8f47EFd337b35A8,
      0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      0x54fB2d85d4c6Da7F71BbA9F3a1B5047a25603F1c,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x35B5D0398429785E5071560252e8a33d0Bd57248,
      0xd1282134a3481Cb548504073ea31E602228f15b1,
      0x34ecd8d4BC82105C456584C6C78e7729e5eDc879,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x302e1856258ccD1b1D6b021e0e113DC2B4f57f8A,
      0xb418Bd3d37e947C4B954C3750bF74C99804Fd776,
      0x2Efc14A5276bB2b6E32B913fFa8CEDa02552750F,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xfCb11F4f6749dd517aAA9f38035FECC1Fd91291d,
      0xbD842fB775c243fD392EB7BAFC5b0DB1Adcb7288,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xF6f4B3d80884DCf2E602820622cafC1Bcc1F9AFE,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x392D8561d047ABC4712ff52BeeA6394379722e7A,
      0x3Ee505bA316879d246a8fD2b3d7eE63b51B44FAB,
      0x186baD94057591918c3265C4Ddb12874324BE8Ac,
      0x89e2a574BdDB193EE5650CC59C8F17B46f18f5D7,
      0x42966eCA78129e60B3AC05890E924c8Af21B899c,
      0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      0xeE060f57De47dbc4c3df93ACA55b1cb8923bC7B4,
      0x087f2606AC8c88471Ab9b011a5338C1bE0f6f650,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x91F893a1859B79A6B36c2936c24b016A680c42c2,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xf6a9dC9a41e8817fBc86532d53D89CA80d9aa46B,
      0xE4797e3e062b799a203FDA426f916878a9f669Cb,
      0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      0xffff62b3205a28f443fa11Cb781a5D63306bd50c,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x35B5D0398429785E5071560252e8a33d0Bd57248,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x030745377d953913B2aF2A64D961287ff800F7E0,
      0xf1841D02a6f70820654D914375f8D1D7B66304ea,
      0xaDDd5A1D51Bff4d67E67ae23FaD94B6B287DE78C,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xA815061274BF6B847493c31ca9395462a82156D3,
      0x00F3BF5C26618F8f2483196B899E3505A0a21e6e,
      0x7597d352C242bE035ADeAaA54267968BcbabA58e,
      0x89e2a574BdDB193EE5650CC59C8F17B46f18f5D7,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      0xD84c2FDF2F8733A5BbEA65EEC0bB211947792871,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xcC7AC869585106fB03911070A1EeB816f13d48D1,
      0x8B804fbd998f612c2B98Fb81B06D993008d1bF09,
      0x862FA4387aad67047Bdc289f02e18a6Add9f5E9b,
      0x31029Bbb7F0a661c39765303558816DF38881745,
      0x793b9F12eA9D417b729D9e7cff6c0af757498eF2,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x95D41776812C6CA222dd5fdea56c065B55FF7655,
      0xc042E357e67900446fB594287AC8ffc011F8f133,
      0x5021ca11545bb39ADEA9cF8CbbEEe9c3182A5c36,
      0x35B5D0398429785E5071560252e8a33d0Bd57248,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      0x2fE05eE4D4D06E545f26cA9275bC0a4831DF398A,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      0xe9822F18F2654e606a8dFF9d75EDd98367E7c0aE,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x2110C2b05e787d28fDDbB30994907FC896072eC9,
      0xCa41A5FccF73D0793BdF8657ED4010ec40F10F2C,
      0xF0cb943e5B2d2eaBAfcFAe9dD404913FdB11a2D2,
      0xD67360166BAF50bd81Bf7972ae5a4bC105E79f2A,
      0x194a55CD4c58a01eAC8ff299470010764c8697D6,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x3bbEBf87B8dB82F59873AcD450Bca31CaF61DE12,
      0xB88F61E6FbdA83fbfffAbE364112137480398018,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x3fc5b7D16ea69B00819d7873fDFF70F6712FD0fe,
      0x827c7bF1FBb12E214904Ee45977A44B018fCDe3a,
      0x1AC08405E96E3561893eef86F194acDB9A24D38D,
      0xe24283E2F22a7a4360DAb185DFeb62190d13742f,
      0xB7dd526d1EdCD81B452465cc3883F2AB495348b2,
      0x5D9bb765C81E6CFd4c8a23d13C54943F31104ea1,
      0x89b0F9cB8E58C5113D69995F144e5f94E1243bA1,
      0x10a8a00aaAD4e31c110D1587D562Df8efD305902,
      0x7e09428efCb471ba304b0723679502C01161F50e,
      0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      0xD2aDEe3Cce690a7Af928210342B86a965548f526,
      0xE734f453116b31938dcc4c14d828A3185456c6B2,
      0x7405c2328b85a1243be0717aBB4185661ec5f4C2,
      0x93f0C941Da115cff5680F83172248e7644f5369e,
      0xEB7a12fE169C98748EB20CE8286EAcCF4876643b,
      0x2D50bF6334152DBdA8Bed2f50e5a0d8456Bd47b3,
      0x5c811EAFa45d24F1bC6fe772f8a517CD05F6A0E9,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      0xeB549edF318FCBBed23Cb3DD2323449E401EBd3C,
      0x4853f85C2827861db711b37696A4a98884e8C635,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x21aF5166e41Dc3371D062131af9D6A25e0F5c7d1,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      0xef764BAC8a438E7E498c2E5fcCf0f174c3E3F8dB,
      0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      0xbD842fB775c243fD392EB7BAFC5b0DB1Adcb7288,
      0x5e58538cc693b1099C68d7fEF963C1f148DaE8CB,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xB18A83EEa77Db549333eAA9E964d8887517B7C59,
      0x49e9432F0F96Bb23261C879bC8b95C46A1941158,
      0x12DDC6dA0777F823a42c7bb83E837c9f32f6e288,
      0xCb6A936a9069AEaB34f15c9DA33b7e78253A31f2,
      0xFD1012c69aC6d41b7fc3622fEb228b780F3E3564,
      0xFF959b44E0723cf6D6Bc3EA43B3B95B3A3028602,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x1AC08405E96E3561893eef86F194acDB9A24D38D,
      0x83DB008998ffE8D49aD8c81383df2153D8146173,
      0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      0xbD842fB775c243fD392EB7BAFC5b0DB1Adcb7288,
      0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      0x9257e2e6503547De42336Ada761378A40Cf20437,
      0x84Bd2DD1A477BBf1487a6cbd6AeaD7Eb865e0fF2,
      0x700570Ada3FEfB97AcB2388AcAf425790B4F11A9,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x221B2CE661aa9Cb5e936DA6fd2bDFd6bbEF71cA3,
      0x9F75C7c19FfEb95B47e62B2c37FfAE12de759485,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xae19466FA6ae7e65B8538Bbe43C1418B9526f020,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x1b3970521955890C7CAA0ac93470EAEcceEde93F,
      0xD90a770752d1fe68f5251c97f95b465a260F5204,
      0x0b13f13c0E99F24b96A835B787D1347B33d87776,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x198e363E2e7d58f521960e4175a7dfe0F59936f2,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xdf7ae98807d69525bb015865bB56EB8966d3F1B8,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xe420A18a8FB5878EFbaEA538646BcF2DA7529890,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x0a7a29432241895997ce9ba9E450d68d971f77F9,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xe420A18a8FB5878EFbaEA538646BcF2DA7529890,
      0x35B5D0398429785E5071560252e8a33d0Bd57248,
      0x91443aF8B0B551Ba45208f03D32B22029969576c,
      0x424D5fE1E20e3Cabcd9d764fbE404098b566946F,
      0x48e180B4eCe7478511BDC7479838A142Cbc07879,
      0xc4E4984e243f2b833e31513Ed4A5025922922D61,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xe420A18a8FB5878EFbaEA538646BcF2DA7529890,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x6A6961f57ac7b6365b9957c6C36E3c6d0DECb07A,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0x58AA50C29BbA417Ae2384805ae7FbAE1381f68D8,
      0xA997baE9d3615dCFa152E42f0261a91b957839a3,
      0xBac458fa4A59b9A03Abd73dFaAf971cE05a83CC7,
      0x447B4EEB6D65E108dD63c3B1f7625e3F3c769f80,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0xBc486420659a2009987207649d5d0b401349f679,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xeB549edF318FCBBed23Cb3DD2323449E401EBd3C,
      0x156CCd54619F17CBD4e31304362361397c18D0cb,
      0x13C6a19CcD443372c3Ce86BC57887ee06EbAEa70,
      0x74ca986859677251580945F9B3f280eA64fF3DE8,
      0xF3D9281fa183B74F32B96E1c5244596045f4edE8,
      0x1795953240570adC885cAA16721B9FE7E26F5E26,
      0x8C75D3585a21c21Bb62cC255836d6531BD948f1a,
      0xf2b96F9C0F597C5926ab87af9511AEA8Cd078C43,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      0x087f2606AC8c88471Ab9b011a5338C1bE0f6f650
      // 0x669E4aCd20Aa30ABA80483fc8B82aeD626e60B60,
      // 0xabb5feD8a72B3344F73A609792da0c1fbD82f4c8,
      // 0xF3D9281fa183B74F32B96E1c5244596045f4edE8,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x4ceB640Af5c94eE784eeFae244245e34b48ec4f6,
      // 0xBBE028771d7d3F9198824659dC18ac438efF1a9f,
      // 0x7944642920Df33BAE461f86Aa0cd0b4B8284330E,
      // 0xDec7706416A8262082c824D1c2fAC4532b0881Bb,
      // 0xCB128eA7d057e02f26DcF6DCaC00EaA5ab5DEeb2,
      // 0xeE61B0d50D96D4249aE0E12756eDC199BBB7D070,
      // 0x6442c1aad456F29e7631398283C6e87FF24942b8,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xbd3635B6967FE6a3DF13597e55DB1D454121F30E,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xdc916b7A282507126690A3D7A6fDCeF115CE969E,
      // 0x91F893a1859B79A6B36c2936c24b016A680c42c2,
      // 0x8669Eb2599eB5EE4791047F962c9c553789C7161,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0xf6a9dC9a41e8817fBc86532d53D89CA80d9aa46B,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x5ea61c2d641Faf0368dEB0c0790DD6A4eE8B23fF,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xdc916b7A282507126690A3D7A6fDCeF115CE969E,
      // 0xbEcF9ceCE9fBC2c9D66c2709CC2BD448dEd30Fc2,
      // 0xdc916b7A282507126690A3D7A6fDCeF115CE969E,
      // 0xefD09Cc91a34659B4Da25bc22Bd0D1380cBC47Ec,
      // 0x2fEe395AB897F305D079c71e9721220b18d7B6F4,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0xf1841D02a6f70820654D914375f8D1D7B66304ea,
      // 0x63c922cC6cE64520BBDa48D8Fdd0DAD0aB75F77d,
      // 0x457eBcAAb3B5b94708207481B9510A983E671517,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x992f8e145c5404E944AEB8f53660985DAf9Dc827,
      // 0x7944642920Df33BAE461f86Aa0cd0b4B8284330E,
      // 0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      // 0xac0a7C9fE59253f8cD3CFfF3eB33f938872b8749,
      // 0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      // 0x18D467c40568dE5D1Ca2177f576d589c2504dE73,
      // 0x1d3ab981AC3ab27B35e4aBaAA0a4de1C48b04C52,
      // 0x1491C99fA49d73f3f5eCF207D47dBfb8a275e153,
      // 0xbEcF9ceCE9fBC2c9D66c2709CC2BD448dEd30Fc2,
      // 0x4c8d263D3d8bCe4e1DD032E3f6d779A74355A9D9,
      // 0x25EA026eC746b43f7A73Bd3632fd18d46178a90C,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xeFc4fd62B5589D0c8dc8bb196E160771C14785a7,
      // 0xbD842fB775c243fD392EB7BAFC5b0DB1Adcb7288,
      // 0x339dD90e14Ec35D2F74Ffea7495c2FB0150AF2Ba,
      // 0x2eb0ecD53d562181B005Ff8711152CA3A5Cb8756,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      // 0x74Be0Af0bf7254328DdffC09425fF71d64a1a836,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x47Eeb072A8DAE3aB80b1E6123a44eCc80d2c49fF,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2dB2838751E05a9E95c1D1eC1912Ac74ef37edb7,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xD67360166BAF50bd81Bf7972ae5a4bC105E79f2A,
      // 0x07126e0853e2dc3eB8AFdAe55117ABE91F10dd0f,
      // 0xdc916b7A282507126690A3D7A6fDCeF115CE969E,
      // 0xdeEdB18a5A08a6D3622a2fcA03c09AFB5719280B,
      // 0x1483249F4EEc65017b06c2C5e577510A5caAC1AE,
      // 0xe420A18a8FB5878EFbaEA538646BcF2DA7529890,
      // 0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x296E0C21DB4061EbF971e55d5db85011E7Ff9797,
      // 0x3C4bf99EBd50cF2C116d95Fc4F9c258b2d1F03E5,
      // 0x58415Cc885717052276dBAA4567584d73D6d3baC,
      // 0xC56725DE9274E17847db0E45c1DA36E46A7e197F,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x25EA026eC746b43f7A73Bd3632fd18d46178a90C,
      // 0x138F034fC2085F679F25efAA092A870C71dDB428,
      // 0x18C2f8a7e2696d28661D59785B18C6794cd8D8e1,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x7166C092902A0345d9124d90C7FeA75450E3e5b6,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x07c9856e6d0cdA3b7d76d2954b61d5462c7CC2c3,
      // 0x6c4a157bdda348Cd8afC93e425bc4f0aeEbD745c,
      // 0x548556bde512596b65471264ADa687a309E466e0,
      // 0x4dBd3F2FC7bDFfE2657F8916AD05eACA21344d38,
      // 0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      // 0xe506e1D1B4607488C2FcaC0742ab199A838cc870,
      // 0x7C2582B6f1cb3B4f1d9d80072e1f8B2C99A7d505,
      // 0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      // 0x19c25885435292501B5E61CFfcA2855Fb6B2533f,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48
    ];
      // 0x2c0593C26DfE61119Df852978752873fdA063B40,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf4fCf13072EAF2d7C68690D3812bdC847106566d,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x8afe241d91D356a83bC8De06F2B6Bb5416342cf2,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x54d498f96374fa15D1373b7B629247D76a9019DA,
      // 0xcCec5e09E0f9EfDDc928386E5072120E5b3436Cd,
      // 0xaf7B5d7f84b7DD6b960aC6aDF2D763DD49686992,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xBac458fa4A59b9A03Abd73dFaAf971cE05a83CC7,
      // 0x99B2531B219E7AAd69f785D15D9dDEff577f2762,
      // 0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      // 0xA1f1A36E4a4CE7ED82172FF77ce55dededCD5Bf7,
      // 0xfBcD2Cf351293C1181f409C25630884B20288EF1,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x501e9987BBF5140DaB604f01C7F013Aba6Dd22b0,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x01c12063B7b5B783A989A60aF9f9F06534307a2D,
      // 0xA8f908366badE5A8B2c3a123550F69e5dCF92c4D,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xf5059522C8Ad92C6A1b1D93d7d88c8fedD1acf4C,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xdfcd6663F6B59cB206772c6A9dcbAb7dB00F3178,
      // 0xf3e3Bdf191eBeCBC84FeDe4706f2B5f05Ee5bE45,
      // 0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f,
      // 0x3680EAF1f85BEc9f120bCAAa9ef469fb849E1781,
      // 0x25EA026eC746b43f7A73Bd3632fd18d46178a90C,
      // 0x21aF5166e41Dc3371D062131af9D6A25e0F5c7d1,
      // 0x50F27CdB650879A41fb07038bF2B818845c20e17,
      // 0xA54e91FeD82Aeb01727a2Bda35a9274EB8ec8b6C,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x2dFC15FBD7cEfcbC6dAc0B683277851b01d9943a,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xf370a659725B3D9f66dDF540C87075F7583f5Ae9,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xeB549edF318FCBBed23Cb3DD2323449E401EBd3C,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x2964719b5307171036b26937C8137a1DFeFa5bc8,
      // 0x6823636c2462cfdcD8d33fE53fBCD0EdbE2752ad,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xd315e295c11827858752B86b5551c624E2B9Eab7,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x8c95225b1046b07a1Dd6499c777dadF89c40EB78,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x7e06E21CbF751f0861A38bcf8572D1143FEA5b9c,
      // 0x5dA69040cc34912Cd0332418f409827eeD42bAA9,
      // 0x97bac212815DfF849820e34b6F9a58e4C40909De,
      // 0x9F75C7c19FfEb95B47e62B2c37FfAE12de759485,
      // 0xeB549edF318FCBBed23Cb3DD2323449E401EBd3C,
      // 0x52DF1474aFD98CBfa651E2117D5248bcD80E1570,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xeE61B0d50D96D4249aE0E12756eDC199BBB7D070,
      // 0x7e06E21CbF751f0861A38bcf8572D1143FEA5b9c,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x6A81338D64888D4e624915a00189f4b9195c1aA9,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xD84c2FDF2F8733A5BbEA65EEC0bB211947792871,
      // 0xC1d16B3dD6Cbd8Df622DAfBf8bd885FDA07569ed,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x177F12d47C58DC69476d7032da6Eff9D38b9BD7d,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0x7e06E21CbF751f0861A38bcf8572D1143FEA5b9c,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xef764BAC8a438E7E498c2E5fcCf0f174c3E3F8dB,
      // 0x7e06E21CbF751f0861A38bcf8572D1143FEA5b9c,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc2c2F42342Fd2Da662D947c32595e06553A50c63,
      // 0x84b6f9d041560fe6A5572c7fA12debE57d1e00B2,
      // 0x11e61AE17e000dd8723705671b356B325f0EB474,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x1EFD24eAd7B6e19b476924Ce6c491C30B6357fC5,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x5Dd2Ca967C96f4088e8c94041e124c602C4Ea692,
      // 0x0A93f436Cc735f4F15Cf982519e8ca4A9DB3bF1a,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xabb5feD8a72B3344F73A609792da0c1fbD82f4c8,
      // 0x6A81338D64888D4e624915a00189f4b9195c1aA9,
      // 0x5Dd2Ca967C96f4088e8c94041e124c602C4Ea692,
      // 0x91F893a1859B79A6B36c2936c24b016A680c42c2,
      // 0x171939e86646319C7dcd4e894FEFe07dFAF71184,
      // 0x97627DEc00d4AdF2c599c7897f2F34a2b59Cb0b2,
      // 0x533Dee7F5e471B34ce9EC908F6c010dc2A160413,
      // 0xeB549edF318FCBBed23Cb3DD2323449E401EBd3C,
      // 0x9182d586e42Bdc38ec7EeB3Cd162Ddd86794864C,
      // 0x39B557A249706CAC1DFfe157cE5D25fF1791b56F,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0xB88F61E6FbdA83fbfffAbE364112137480398018,
      // 0xaDDd5A1D51Bff4d67E67ae23FaD94B6B287DE78C,
      // 0x12ecFbEc9e6e4683cEf0A126C86bf1CeC2AD432b,
      // 0xC56e93c7D05C33799D2aee3D1B8eF840c514ee61,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x3674b037828496D9f627dEc88872772923f7C70B,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1AC08405E96E3561893eef86F194acDB9A24D38D,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0xCE9fc27a6b15a5eAf9B901dB09DdF066BF649Cc9,
      // 0xf3E52C9756a7Cc53F15895B11cc248B1694C3D81,
      // 0x3Eb7F9D036De12740136DdE90727C9DFE2B8eD42,
      // 0x33A58b7a1F46aa945993302F0A7a812888c35DD4,
      // 0xf6a9dC9a41e8817fBc86532d53D89CA80d9aa46B,
      // 0x137736d85eC3e9bC0d91027a217393c82F3f3e27,
      // 0xcf6b8a78F5Ddf39312D98Aa138eA2a29E5Ad851f,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x42966eCA78129e60B3AC05890E924c8Af21B899c,
      // 0x88f516C04969f470888473458B5E09342Da08b7a,
      // 0x88E3378dfb5463A0d151F802a48A104698e90e3D,
      // 0x61a6f36B621860d030ee9580e073343a0998D240,
      // 0xEe7e3D56aEA1e61c3539473DEb02073440173Ea6,
      // 0xde923Df474661dDF3727C913EbFEe3df0b37BEB8,
      // 0x194a55CD4c58a01eAC8ff299470010764c8697D6,
      // 0xfCb11F4f6749dd517aAA9f38035FECC1Fd91291d,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xD67360166BAF50bd81Bf7972ae5a4bC105E79f2A,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x18C448E6033fA484b8eA94DcD3a853ff02D390A3,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0x33A58b7a1F46aa945993302F0A7a812888c35DD4,
      // 0xefD09Cc91a34659B4Da25bc22Bd0D1380cBC47Ec,
      // 0x0018bb2E2D85DF0c70d0E76b6f1CCd7bE18763fF,
      // 0x098B716B8Aaf21512996dC57EB0615e2383E2f96,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x6c4a157bdda348Cd8afC93e425bc4f0aeEbD745c,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0x25EA026eC746b43f7A73Bd3632fd18d46178a90C,
      // 0x88f516C04969f470888473458B5E09342Da08b7a,
      // 0x5139C2D023c638A5F5190858b2BA4886873Ed027,
      // 0x58415Cc885717052276dBAA4567584d73D6d3baC,
      // 0x46169Da5A6056b6Fcb64412c27097418cc163667,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x91F893a1859B79A6B36c2936c24b016A680c42c2,
      // 0xc56334C9c54D06Dc73aD5576EA8A22c90806af8a,
      // 0x029D3493573435289FBA0AcA21b23E129B46809c,
      // 0x457eBcAAb3B5b94708207481B9510A983E671517,
      // 0xA996D391f64158fB17fb71d6A4Fad67dF7410895,
      // 0xFb7Ad45dF71dc18237FC30f2E4654E733D4503C3,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x92d2cFf81d01f5DB3D5aaA07A4fBaBE53De9AC2d,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x89b0F9cB8E58C5113D69995F144e5f94E1243bA1,
      // 0x259478C08bdf4224a87F9420951d20DF731131Cf,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x976378445D31D81b15576811450A7b9797206807,
      // 0x0a7a29432241895997ce9ba9E450d68d971f77F9,
      // 0xfd3ea1D43D610d315dE7064478F30D4C502B4f17,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xeE61B0d50D96D4249aE0E12756eDC199BBB7D070,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0x3ccD7B219252D561E3E555Da25f9dD122Af94BF1,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc8c9771b59f9f217E8285889b9cDD7B9DDCe0e86,
      // 0xc042E357e67900446fB594287AC8ffc011F8f133,
      // 0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x087f2606AC8c88471Ab9b011a5338C1bE0f6f650,
      // 0x5e654DAC8eDBf3beB99add835cE64410722Ea8ea,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x91F893a1859B79A6B36c2936c24b016A680c42c2,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x5aeFbA3327deBA9C042034709d4f0E1e8d8E5b5B,
      // 0xeF3e454d38A7b7A9eCBE49cfecAa4F30bB31B60a,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x9eAeC4D4296D3cd7C59847cDbf5c28C2C0ad0BC3,
      // 0x7981249568EE5D8f35a30b284F475fe0cF5e4Dd2,
      // 0x6C65fB326e7734Ba5508b5d043718288b43b9ed9,
      // 0x4a9DddAc266DcCe0E6923F0298267909F2FF761d,
      // 0xce719191F22db9498250f37672BF3f421Bd42c41,
      // 0x4dBd3F2FC7bDFfE2657F8916AD05eACA21344d38,
      // 0x29E3fcB9F4aaD6225f359DE66F3e81E643Ac1DcB,
      // 0xab0ed82707c337A4123C7917D6e5a8A1Edad1550,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xA21b3CD198EC3bA865CE18ECba87cE12f5dea170,
      // 0x5bA6624Ed97EAdDC2a2b5778A2771716Eb4Ca96A,
      // 0xE887dA11177A6295581c8E6320857aE595eb133C,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x5bA6624Ed97EAdDC2a2b5778A2771716Eb4Ca96A,
      // 0x4477C29d4CaDdEEcf182201940fdB706E416468e,
      // 0x77cC78E9C0CFbB7516d1dCCE58fe5d09593E820a,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x4A17A271c10CD693f0C0e295508BD72De23658E4,
      // 0xE6a9D0539FAbe0Fda237C3c4baFEaE2042B06E67,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1aD7b7c2Ed5173e6C982b1c3FbFAC2EA2255749c,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xf87aCAA7c2446Ff1BD45827f55F7F75104ab8614,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x41a1842907F67AF8A25338e22E45f9dc88266CEE,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0xcE1049A02cA550CcFA2d6ac6a411Fe888919dbA9,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0xb6321C5E3D0A97B8d4218BC15Ec95bD8D1F7d639,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0xdc916b7A282507126690A3D7A6fDCeF115CE969E,
      // 0x27524bfF4423404F4b516367Bd6a67c71876aa7D,
      // 0x7CE244e2812f3f73dd3294b0e71397ab819B57ee,
      // 0x3d0418e036Fb51520eD665eD7d2D3552B03c8957,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xd1282134a3481Cb548504073ea31E602228f15b1,
      // 0xcd30eA45715C478A3812963aAcfea8002dd9eAB8,
      // 0x6356624291C2Cb4915062965159cD562BfF17569,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0xb910711151298056c1fC9fadc8310E7Ef1F2731c,
      // 0xB88F61E6FbdA83fbfffAbE364112137480398018,
      // 0xB520F068a908A1782a543aAcC3847ADB77A04778,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xe420A18a8FB5878EFbaEA538646BcF2DA7529890,
      // 0x5dFa160e0f96CE631D28649D02bB7738D69FE761,
      // 0x6c3E007377eFfd74afE237ce3B0Aeef969b63C91,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x528358b0630D0594eD2858b308E68511aa365BEf,
      // 0x0F054F1D8231B9DDC17D65E24290431365840C30,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x5f01C9f93167b08fdd2712Cd71d86fB0C6bC7489,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x845a7a04Da395f801cddc30C4A6a55A0BE4B9C00,
      // 0x74ca986859677251580945F9B3f280eA64fF3DE8,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf8c9Be2cE5A48014D4686A0871361DDB5E08fC86,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x634ae8E7068535b00026BCAAb1C3D1996645d2BB,
      // 0xE0F9dB6371b697906117DE41B218D13e64798BA3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x85838816B9330b9Eb2F989C55454D280da1DA60E,
      // 0x665654f2D2a151bE2D0F8E3697e6Ce780F732aF2,
      // 0x3bbEBf87B8dB82F59873AcD450Bca31CaF61DE12,
      // 0x94213B594B32a8B50A32e54c75eFedBa484Dc596,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x221B2CE661aa9Cb5e936DA6fd2bDFd6bbEF71cA3,
      // 0xfCb11F4f6749dd517aAA9f38035FECC1Fd91291d,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x259B363016A515411EDF4c3D627Dce90aa307410,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x168C7CafaFe0551A17c80f2d4318838DE747867A,
      // 0x53018627eCAe43674764b9d8a433B1fdCCf1F155,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xF7384851D761ba4A36dC35E6A3024869B02B32c1,
      // 0x9eAeC4D4296D3cd7C59847cDbf5c28C2C0ad0BC3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x58E2B4d76F66F2e71D1Db865c4F4C8e9ADCC13C0,
      // 0xE9F4a19B3E27FAA296B6AaCABe3E5Cc672169406,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2964719b5307171036b26937C8137a1DFeFa5bc8,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x548556bde512596b65471264ADa687a309E466e0,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xfCb11F4f6749dd517aAA9f38035FECC1Fd91291d,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x85838816B9330b9Eb2F989C55454D280da1DA60E,
      // 0x1BA516D97680b75e9663234EaB1b1b80853e3634,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x315f78aA18342155B65D87976C5aC1CeFaf5D1De,
      // 0x2453087610d7270189AE5d75234B46C9DDE7F6f2,
      // 0x219d4fb236DFA771CAf1Dad9bBbA808f20CC9D95,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0x9eAeC4D4296D3cd7C59847cDbf5c28C2C0ad0BC3,
      // 0x6fa077729F9994b11ea75d4a4e7A1fa3108dd956,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x763EC9f6477c3d05DEf7FbF96085F8De0C221f84,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0x0e442C7D7db830276EcC7292Bc57456309Fe1522,
      // 0xb9FFBf7D5296030F8c3645905bd65148f1f7928E,
      // 0xcC7AC869585106fB03911070A1EeB816f13d48D1,
      // 0xC99f40453B4EF2630261344220394740dA47BEab,
      // 0x88c218D5E564F3b62b878D8FE86b41639D82aD34,
      // 0xA996D391f64158fB17fb71d6A4Fad67dF7410895,
      // 0x2fA57186D6e07E2F4c83e03808fD48833c2e5850,
      // 0xd301EBb2287a5Fe12f9c97587831Bd866a689aD1,
      // 0xB9254df812ce1f35f9DEe3AAda5228d7D32fAae1,
      // 0x85074968d0ff84F4a0cCc6EE50327Ed8f7A8Ef32,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf6a9dC9a41e8817fBc86532d53D89CA80d9aa46B,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xACEDB42f28a5b05603D9004BBb65218D6c2e5927,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7d4aB933436026F8591d4932B76007C4308bb679,
      // 0xF11D07682EDFf6C26f5c73e80B298C5A69C61f4B,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xB0623C91c65621df716aB8aFE5f66656B21A9108,
      // 0x4dBd3F2FC7bDFfE2657F8916AD05eACA21344d38,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x860993DCB240bD1e60F29F1887164F15FfB6a049,
      // 0xffFff449F1A35Eb0fAcCA8D4659D8E15CF2f77Ba,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1e2aF855B0E590D8e2AdBe05f84fbA0bc1B899A4,
      // 0x095eeF90ae6E1759d8c2294c952f895fF6a5C5F3,
      // 0xD2aDEe3Cce690a7Af928210342B86a965548f526,
      // 0xfCb11F4f6749dd517aAA9f38035FECC1Fd91291d,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xce719191F22db9498250f37672BF3f421Bd42c41,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xC7a669d0de21F1885361E95fDE3892534807b927,
      // 0xeDBc1122E86809330C676A2f68f63f73703FA2E1,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xDF12161AfaF4367F130bBd7aEb50abFfCE612619,
      // 0x89b0F9cB8E58C5113D69995F144e5f94E1243bA1,
      // 0x40C86C04d992B4c75F232EcdC3F4932f0D588655,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x5e0C1E5Fb4Ebc2840c8bcb847dEDAa846645d334,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xBf3f482aec6342EF18C85B00efE3A7c08afb98e7,
      // 0x70506e100F837B1fd4a374f84DD77b3CCD14EB24,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x845a7a04Da395f801cddc30C4A6a55A0BE4B9C00,
      // 0x587c74EbF67b839690f11724bb15bcb86f1FC713,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xF5fd316dBDF8A56B8AC76153E3EeF0499d82aE1d,
      // 0xC5D959C07B969A6844a3bd690DABfe3fC4677d63,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xCa41A5FccF73D0793BdF8657ED4010ec40F10F2C,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xDE2fd50C56668D0e6326E32397cF5d8CF7e3Bc07,
      // 0xd73fC85c3bCe2C4B3b04375C8A41881b28259Ef8,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xE0F9dB6371b697906117DE41B218D13e64798BA3,
      // 0xf1841D02a6f70820654D914375f8D1D7B66304ea,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x4fd53436b293d56C554Ab52B16C957D5960E3A08,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x392D8561d047ABC4712ff52BeeA6394379722e7A,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x28e38d3Bf57969DDb28eab925aD4DE50Be0280Fb,
      // 0x503D66eA74445aF5E9ADa4005f3826591F10B98E,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xAE1704EA3747e4861fb7283a9EaA8C70B925295c,
      // 0x793b9F12eA9D417b729D9e7cff6c0af757498eF2,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9B2062d0b3841e9aB9F8f222cf1b7e8eDFf94024,
      // 0x6D361440Dd4746387EfF1Ae65DdBFE891059e0Ce,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7E65fEb1853853486A8db468A654Ef7247fF8F03,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xccBF87A238391F752D594cF9407099456053fa02,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x6F3bA8A845D18D32bE6985650E449d7c29926F7F,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2dB2838751E05a9E95c1D1eC1912Ac74ef37edb7,
      // 0x5209d14199a60E8E9429293A87017d7125b5B9dC,
      // 0x7B77D3ba373040f868a92C54c9B234A62988D4D9,
      // 0x9B921faD875b06183d3992A125026c89915D71F6,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xD67360166BAF50bd81Bf7972ae5a4bC105E79f2A,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x5da7351A4Cb03c33e11F51841bc614d985812821,
      // 0xf1841D02a6f70820654D914375f8D1D7B66304ea,
      // 0x1DcC1Ebc77c0714f8f18eC1114a953499644b6B0,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0xDE2fd50C56668D0e6326E32397cF5d8CF7e3Bc07,
      // 0x85074968d0ff84F4a0cCc6EE50327Ed8f7A8Ef32,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x3eD58CF30b18F5593dF128E8553608448a05aF11,
      // 0xF7B18e107eb36797f4cE36dE756630B9C30969ad,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1AC08405E96E3561893eef86F194acDB9A24D38D,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xD1d6014AaAb75be02844C2Faaa64e4C8757D6bd1,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x84572C31ACdd30c03982e27b809D30b1eFbCD8f2,
      // 0x594183C914743d1B47CedfC0dca936b354bac4e1,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0xFcFfd68D04e2ddc80c4dfCaF3C0b05909F8064AD,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x71D9DCbcf5B7656e22163A404aB3A07A70aEb7E4,
      // 0x8474c43970481015019819936793DDc210a0050e,
      // 0xf8E980b6115ba6668eB239E1Ea0C1d980D095FE9,
      // 0x461DB4Dd49ca3877e1201Cb88276858597af540e,
      // 0xD784817AC75B0ba5592d7E29Dc03cDD883C07E70,
      // 0x20e9d382B137DABe2fB5ee44A6d3A660E263430C,
      // 0x78737732Ae34CbA60A3f0a6D05fEB8FCF6Df7a09,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xeFe82f70D1E234Af0548058BEce17E01F6Ca8c78,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xdFcE273F893320fc9aBF8Ac91Eed3E0dD8237DF9,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0xa563ec4b2F3937B9F8285cbFDF427fA22503471C,
      // 0x90320A270a1d289a668BB91d238250C35f8CF158,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xd75305c70257b1a78641Ff42e0ea15b10054DE0a,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x644f2A357b7D2f6588f3Ef913EEB4EfEFd30f59a,
      // 0xA4C08137E0A0401b0c94c2e7EE1794F258bcb228,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0xe23b7061b158B9d060FFc33ed7199667E4Fe88ef,
      // 0x461e76A4fE9f27605d4097A646837c32F1ccc31c,
      // 0xD67360166BAF50bd81Bf7972ae5a4bC105E79f2A,
      // 0xE4797e3e062b799a203FDA426f916878a9f669Cb,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x5aeFbA3327deBA9C042034709d4f0E1e8d8E5b5B,
      // 0xA0960D993db6d64f8E948175AC064a46EAc1cE51,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xF01E07ae42369175a986Bb13fb3E097d0724f74a,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9b59dED3D30933C9755f7abB7579F20281BF2083,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x5aeFbA3327deBA9C042034709d4f0E1e8d8E5b5B,
      // 0x2EA58CfAE2E5623711047778524Be7Fcb371f2da,
      // 0xA1f1A36E4a4CE7ED82172FF77ce55dededCD5Bf7,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x99a5331B9AACAeF3516db30d9C59EFa6C760087f,
      // 0xE1FF19610020D72930aEe1b9c047e35B7fD0080e,
      // 0x439393fB55623FaBB87f0b2ECe5656D63D2a3E2e,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0x000000000000000000000000000000000000dEaD,
      // 0x4FA96E1A141d7E77351CdC3822f08Cb325e52116,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x57524EfC73e194e4F19DC1606FB7a3E1Dbf719B3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1882ef82564f46aEb20a0D5759CDeBcAeF4dE5A4,
      // 0x537bf75de19f3d229e3a9018EE1A23c0c9C7D39C,
      // 0x12ABfc805CBb1EF7a898a33F43301BbD24A5d8d2,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0xc2d48E6674b8047D2A493a4634d790909a4b1db4,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x53018627eCAe43674764b9d8a433B1fdCCf1F155,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x9c5083dd4838E120Dbeac44C052179692Aa5dAC5,
      // 0x9CBF099ff424979439dFBa03F00B5961784c06ce,
      // 0xa984ECF1aCA8dD45E1358034D577b6d2C7032262,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x11fA77995bE9aCE56EaebC4fD3A925DD1127e4Ff,
      // 0x48E1D8dAE86ABfe39b0b3A853d82400793327D7c,
      // 0x13FfA3071676F6aC173b97C7Cb6aBEfB9a2C3A18,
      // 0x78737732Ae34CbA60A3f0a6D05fEB8FCF6Df7a09,
      // 0x82b6643Ce8Cd0Ab6664C44215039A3fe4c1660e5,
      // 0x40C86C04d992B4c75F232EcdC3F4932f0D588655,
      // 0x2Fb8839da4B52658a4c60B707F3d3668DC853454,
      // 0x78215C31936cfA04b0DFaeB7DF420ADd98700f14,
      // 0xC2f094439cd1fC45af3e8a679984927AbAB0D3d9,
      // 0xA556a5a50d2C786617263414878214A9159d1433,
      // 0xF339d6B131ffcE3Efd11d97E5A50E14a9C238e0e,
      // 0x009275e5D2197b93Ef02e33d0cDAa625C03aDe56,
      // 0x13C6a19CcD443372c3Ce86BC57887ee06EbAEa70,
      // 0xc9D483b27701A1299c09872b813BF9CB8251475A,
      // 0xeF9841A2671342eF0ea33C85f2085dC39F350256,
      // 0x5bA6624Ed97EAdDC2a2b5778A2771716Eb4Ca96A,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xDBc7b48C4CC6213E7B51edbc0406717Cc9b5Ec3B,
      // 0x80fb5880F38185661962E475ac1557817dc9faea,
      // 0x05E2461c8c10138aEE241268f28dE6003D3DBAdB,
      // 0xcC7AC869585106fB03911070A1EeB816f13d48D1,
      // 0xf1841D02a6f70820654D914375f8D1D7B66304ea,
      // 0xc3Be023A8CF8f47cd29245f894E217E08007CA7A,
      // 0x722B8F6F6bD86cC3aA1f68781298466324359Aa3,
      // 0x207b4A2b37B38E54217ACb4b8C2CE7025bd14759,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0xf590Adc83c1CdA95Fe45A8f2942030EdF8472434,
      // 0x467D76E2E624AB8e8EF4B247C4241C1446FDbb86,
      // 0x5B44BAaBF9b9831852e9FBB037919e4b170B2477,
      // 0xCD8A4B92c51354Fd901AAb8263DAB439Bce29015,
      // 0x887299cF58A3f0BA1f6eE59122E19a65EefE2BB0,
      // 0xA2400EBfcBd71be15D8f33aA3a6FbeBe238Ed86a,
      // 0x25EA026eC746b43f7A73Bd3632fd18d46178a90C,
      // 0x23C59d5CF69158821F9134Cd359c4B538A413C1a,
      // 0xc3Be023A8CF8f47cd29245f894E217E08007CA7A,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7BD3429450F4d887BD268C757c26Ec90dD3CA9E5,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0x89831EF83444823b033CBfEbf877a197D39aA231,
      // 0x42FB05E09f8A477620dEFe49AF76e577Cbd791D8,
      // 0x65fDaa0Eb1D6753305e5812FdaBF157069e2668D,
      // 0x0d19d161ac8B2B1b0677b4FbBF2e46c8298D075E,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xf71285964bF166A1dA2d61D58e4c67D272946aa6,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xe63Ba03F3399ccDbC346977482920c7F782649B9,
      // 0xb0D0dD7550E3F1d3725dcc4D67F323294ccA322C,
      // 0x0d19d161ac8B2B1b0677b4FbBF2e46c8298D075E,
      // 0xf590Adc83c1CdA95Fe45A8f2942030EdF8472434,
      // 0x544e3F54CAD02F469e4038c235A459f62C9A06aa,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0xE887dA11177A6295581c8E6320857aE595eb133C,
      // 0x31029Bbb7F0a661c39765303558816DF38881745,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x4dBd3F2FC7bDFfE2657F8916AD05eACA21344d38,
      // 0xA4Be0bed522bB6225b5A1C0DF9a9D3bF3441e71a,
      // 0x5FD7783c07A8173Ec7f74c681687D960B03f1F4e,
      // 0xc9Cef03f9204cD66F395aC2E0BB2626324718718,
      // 0x66D6Ec389c80117e74f330555aceFE0dc3600177,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7F15D22187422a8457637Df20F381e92aa5BD67E,
      // 0xA82e8beAe1De30f579ea17C6281A53284d9a98C5,
      // 0x19842f610F5cf2CC8A79CBE7AedA66B4AC6382FC,
      // 0x35271f374D269B95522ef9e39034c2e6Fdc29079,
      // 0x42c8Df348150519A6e8Dfca862a0D0f04c6B6020,
      // 0x52d22F6e4cbc0B125b560D9B62c2b0D886d12B0D,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7422d32cb5919d7478b843Ed6729c9aaeC6ce4dd,
      // 0x5aeFbA3327deBA9C042034709d4f0E1e8d8E5b5B,
      // 0xBd0F5D4Be49f83fc26925d454533dA2E2504dA6A,
      // 0x2E21f5d32841cf8C7da805185A041400bF15f21A,
      // 0xDf54D32b125399E06956D17c1CB5eC200f3dCB24,
      // 0x221B2CE661aa9Cb5e936DA6fd2bDFd6bbEF71cA3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x114340Dbeb8E471a06860c030cc5CFBd3bf66408,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xa984ECF1aCA8dD45E1358034D577b6d2C7032262,
      // 0x0d1d74535bCAbda2dA2CfF5A53C2B899901D423B,
      // 0xA0506d623Ea4ccE494f38C25b1Ff47E823B120F9,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x48431e3AFd6254C73692A5D024a5Cfe23b0479Ea,
      // 0xf6d79DEC527467C60e6CCE69193829522B8438a1,
      // 0x6Dde7372072036EeFAf880600dEE87d5019aD2D2,
      // 0x4E8Ada817B9d0469191f2aB00722e189Cd0cf717,
      // 0xf5711e121C2e4e0d22eEc3591164fd2184fc2Ca2,
      // 0x7D1a4878120110d6201182acd43D95779A716749,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x0d19d161ac8B2B1b0677b4FbBF2e46c8298D075E,
      // 0xBB379331De54A7c0a4b2bfF5A54A14cdba7E9E6d,
      // 0xd76A04222fACe10944eF9c82bA58b3D3f652bC39,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xb4A1162a1603d70916e0c7355F3242c6d1ADeF74,
      // 0x980072215E8c0Ee6871C352A20056467f295306d,
      // 0xC2d875d553Fe9600Bd4904f062F613394c9AF8eb,
      // 0x461A5B8326bA0e2DFd133651A3b559Dc8d3B0400,
      // 0x79a85d75D8D3DdFcC321cfD47289Cb8F215A7e9f,
      // 0x35B5D0398429785E5071560252e8a33d0Bd57248,
      // 0x1eD3D146cb5945e1C894A70013Ed83F95693EA22,
      // 0x9f84F2510BbD44cd294caC5532C205C971C422B3,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x346aa548f2fB418a8c398D2bF879EbCc0A1f891d,
      // 0x4bED23C363f51c4fF842eB0C1CDEd2010E4491a5,
      // 0xd4cD2C3A61d3F64484d67748aC0CB3e4e5b34689,
      // 0x2cc2149D905fe27841055CC31700641e0E6C944D,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7944642920Df33BAE461f86Aa0cd0b4B8284330E,
      // 0x4dBd3F2FC7bDFfE2657F8916AD05eACA21344d38,
      // 0xAcca6Db5b8F11b8588931c57FCB11E7B3c88d8f1,
      // 0x756624F2c0816bFb6a09E6d463c695b39a146629,
      // 0x5eFA253bfA8C626000393C6C654611267261d942,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xcD1614532D3A47d3640880f216b94C197397B5A9,
      // 0x020E02889ebB5a0878dE1d5b127a7A950690E568,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x354D5FcF8834242970498126307623363e2F50c1,
      // 0x7fa247DAa39DC2389eF4C3CD39F6f71aC415d911,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x84A9E0c0C3ffa1f460862C1e97521e5CdD428CAD,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x42F12FfBBdA1A1e513413A8826B60Dde57E4c4e1,
      // 0x0d19d161ac8B2B1b0677b4FbBF2e46c8298D075E,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x7129849D66604cae62b92Ea796948d42476EF9A2,
      // 0xdDf785b09D9273756d09Ee866E1e0a442e3dA14a,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0x1b49504d0BA12df901b94bAE3597c27AfaF40007,
      // 0xc4dB90F8C23cAC7b9e8Bcdf3c9a718d3B68865c0,
      // 0x323fBFD062bF58d32334e8Ab510092fa30578024,
      // 0x01c12063B7b5B783A989A60aF9f9F06534307a2D,
      // 0xA5cc233C5f949f080D1e195798d8ccEB516e9afd,
      // 0xaC830C753f67ead0646E039771e9B65ABc2d2680,
      // 0x9E64B47bBdb9c1F7B599f11987b84C416C0c4110,
      // 0x6adE4B0Aee249ff108dA1fF39280ec1e46138F63,
      // 0xc6b094623AEef377974ad372B7a5D42a0faea524,
      // 0x11dBbDD3d3b7Fa1f2f756B578FFf64aB20e78C16,
      // 0xA997baE9d3615dCFa152E42f0261a91b957839a3,
      // 0x080592Cd90f5147357120b3D2725ac1B70517A56,
      // 0x52d22F6e4cbc0B125b560D9B62c2b0D886d12B0D,
      // 0x6356624291C2Cb4915062965159cD562BfF17569,
      // 0xF50355c156F2b608Ee3C915E2A96903d190128aE,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0xBb8ED1841BfFc5Cb82eeF9bEE9d71D4eee207bDf,
      // 0x42c8Df348150519A6e8Dfca862a0D0f04c6B6020,
      // 0xeb2731794a9627Db5FDed25e7f8bB977faD767d7,
      // 0x227c7DF69D3ed1ae7574A1a7685fDEd90292EB48,
      // 0x1882ef82564f46aEb20a0D5759CDeBcAeF4dE5A4
    // ];
    return airdropList;
  }

  function _ownerOf(uint256 tokenId) internal view override returns (address) {
    address[AIRDROP_COUNT] memory airdropList = getAirDropList();
    console.log(tokenId, airdropList.length, super._ownerOf(tokenId));
    if(tokenId <= airdropList.length && super._ownerOf(tokenId) == address(0)){
      return airdropList[tokenId-1];
    } 
    else {
      return super._ownerOf(tokenId);
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

  function verify(Auth calldata auth, address account) internal pure returns (bool) {
    if (auth.key == "") return true;

    return MerkleProofLib.verify(auth.proof, auth.key, keccak256(abi.encodePacked(account)));
  }

  modifier onlyPlatform() {
    require(PLATFORM == msg.sender, "caller is not the platform");
    _;
  }
}
