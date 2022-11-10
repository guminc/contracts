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
error URIQueryForNonexistentToken();

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


  address private constant PLATFORM = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // TEST (account[2])
  // address private constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
  uint16 private constant MAXBPS = 5000; // max fee or discount is 50%

  uint32 private constant AIRDROP_COUNT = 20;

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
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

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
    if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
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
      0xfeE5B1baaC86e15815ccD6AC891fE8ba1b90B7Fd,
      0x531e484558642e2DddE671fbfd1be52b1931a99a,
      0x5fE88A57e6316F95deC8a0749BD55142584888aa,
      0x1AC08405E96E3561893eef86F194acDB9A24D38D,
      0x25242030D531fFcc8218CCbe58429150d9C43528,
      0xF3Db2ea2b0D22265Aa4717a71F75f48106EFc588,
      0xcC7AC869585106fB03911070A1EeB816f13d48D1,
      0x4b6c841Df713a5a67163546D7e4EddB69D3fb8be,
      0xBD95231dB568154beBf47A3b60937DA2180F768C,
      0x254b120397224375e9080B7D90E56e56151b6979,
      0x5597309B01eFebC018B8BeF9aef24a5eBcB199cB,
      0x686C6020c22AF8A10deA3490b23Ed2D74dd8e738,
      0xA87122E39391B7A1C6a5d1D7166b1c3bd5eB6843,
      0xC56725DE9274E17847db0E45c1DA36E46A7e197F,
      0x19122007E1D9B120b167e714B53AcDCD80c014F3,
      0x5021ca11545bb39ADEA9cF8CbbEEe9c3182A5c36,
      0xC9b5db189631ED9bB35eb795826d90717b43B56A,
      0x2E229196c169dF6Ea418Af79115de0D9b4d3eC61,
      0x1785B99e7E86aE00A3D120F0b57528F2484e3cF6,
      0x7bCBa9296Df0a11Afac47881E9c08B40371Ba008,
      0x7a18960043093E89d804A30D5664Ce769cd153A1,
      0xCF7299283370461F8629115737c4BEd1078fEFdf,
      0xBb249f7EB783ECb16299096e460CE334a05fbB0D,
      0x541c71D3Cd2b749c85981b24381A6dD136825c39,
      0xa553DA0483F7A84320250aBd59f37Fe3672FA994,
      0x0595CC0e36AF4D2E11B23cb446ed02eAEa7F87FD,
      0x687C530278e6C4a9d4Ad9A908433141E3e51B666,
      0xCb5ca7a446Aa41AcFe19A8e4b804B15E95C48E91,
      0x8cb096232Ec748b64455Af90278f3485bCb8E225,
      0xcFF03aB20709c928d7478764473e386F7b23EDD1,
      0x0700D8a9c0B225946b60F8d24661878CAA6683A2,
      0xca9188A34503EE47Cf642d59F5BBB0fc5723E24c,
      0xd17836dd9dE8b1B37Df44261BA39a1f4632eb788,
      0xa83974bE125D3fE4bED3F530798Ef3f87Ec21748,
      0xC16623Cb1505c57C56B3dd9633DbB43991ab2804,
      0xCD8A4B92c51354Fd901AAb8263DAB439Bce29015,
      0xc3Be023A8CF8f47cd29245f894E217E08007CA7A,
      0x5F9AD7D5249dF11CDce543Ad3945B6B924C1eE0b,
      0xC24D5B145C21f570A38CbB95CFD8EbB923182732,
      0xC2675CdA4b4B6c3D8e8Dc687cE6d1c5417F62a97,
      0x4a8AB8F9E8E2b23f86eB12688D71e260060F1D4e,
      0xe43A5Bda37e98A9fb6F40Bdee4147C7D0C5a7dDE,
      0x20d22B81fA930dF6d1C9a0048f3263fD3247457d,
      0x604a060D8EAA48Bf10eD99B6F643557d645Dde82,
      0xeE61B0d50D96D4249aE0E12756eDC199BBB7D070,
      0xc4f7dDF70e470A560D53810Ab87bcAd7E110a2D6,
      0xC249F7642cCF8301Cf0057C840D06c5Dd7E6Cd1E,
      0xF69B16aa5fdfA2142608932083830C4c49Aa4dE8,
      0x6C93bf900fb2eE79959feA354ec24Ee382C36F91,
      0x978374D3fE461E753C32f63e09d2c1F220F869dd,
      0xbc02d04a1665486Bc6E58Eca5f63B387D07109a3,
      0xaEaE3201957353A9D0Dd24321E866e92e1C13d86,
      0x41538872240Ef02D6eD9aC45cf4Ff864349D51ED,
      0xf8c9Be2cE5A48014D4686A0871361DDB5E08fC86,
      0xeA4007a31D9a81C52C5A5106DFCa203000E4E885,
      0xB520F068a908A1782a543aAcC3847ADB77A04778,
      0x51fE29Bd98286b4ACA36BC5BCfC9f11EF4E24A8E,
      0x4a908bb6D261c80AE9CA15F7B8d74c401287ea19,
      0x00B04BB9d4ABc3248E42227718Aa4c810BF69D52,
      0xb48fA58593bA6e8037e955ffE141126e768b40df,
      0xF6f4B3d80884DCf2E602820622cafC1Bcc1F9AFE,
      0x5dFa160e0f96CE631D28649D02bB7738D69FE761,
      0x27524bfF4423404F4b516367Bd6a67c71876aa7D,
      0xdabF36a99aB62bF727B47150A6423ADDE3F76Afb,
      0xB0D0b6dA40e1B3aBCa12a38F5bD95793De935635,
      0x78235d7B68D7650bEDfCc1b051a178fE3eF67115,
      0xD0D7d2aB10c886230BEcC862529BD5B93e531bfE,
      0x36fBd671e61e245fcE9C7e88BFAA244e3BA2B9Ee,
      0x6054d61eB4c4153B7F5BfC31cB0f20Bc85777E7d,
      0x7E41E492351e46ce82dfD0d373E6e519a02F9a69,
      0xEE6CdE5d06a4eE4c9AB299F759f36FEEdfEEd6bc,
      0x0A695b4557002cFE1De071AaDE3e255D7fe3cF0D,
      0x0cC3a8E94b667F0EE16b89a44b27942Cb8b482F4,
      0x932a824A4d3d0680e0b352De150e6f212B8aC841,
      0x3Db78767fc98de7EF7Fa5ea18C5AcAf17fcfc51C,
      0xf24e82bB114B9dBc3EFbc2936E6c7C7aE7c5C121,
      0xfFC88fC868A01003Fe5D3FCC389051a365d4f932,
      0x28a3182325A294b2f9eb021e70a5F11E9437c4c5,
      0x364D8FbB31dA302BA53429a2D559a50A841b7722,
      0x10Dc08C8B05c355E2523433dE3616E9F5e2E0b51,
      0x84Ae883dED3F90828eA87D48340D44CB3Df3Ec2D,
      0xB332c90b5346228c70941C6762BaDDe857e1Ef37,
      0xcf64ee1dDD318C2F9326d15B0DB8854dD0332AF2,
      0xC97a46fa2Adb154B84057cb49577Cbf07AE8612C,
      0x1e75063AD5eBdA5dd668A110caCBc6D9Cf6157BC,
      0xE5B4882eCe508546868477AB8a21D2BB970C12f8,
      0x6C75952144cDB3130B383f4F7F45c773147eF178,
      0x20998E06cF13898AeB5c28Ec1D972B74cb02De9E,
      0x1B02E600cd593eA54185915fdBd2685A0b7e4b17,
      0x65E5CC34B92e6dfA3c708C7911ab11Ad4F65B54E,
      0x15109f7f8Ac81710daec2bc9296C4bAB677b6820,
      0x028922106555DD3909F7aF0117062fFb6a16B9d8,
      0xEF9Ebb6998d68aD082035a609F6a1765639cEc95,
      0x1f250a082D6ac29514D6EE0d067AC547Ce1512D3,
      0xB35248FeEB246b850Fac690a1BEaF5130dC71894,
      0x35c163d134C9CD32EF61a5Fc7d40e5125E91610E,
      0xFe0B881F969E2CB84430d46252067a6c216eEFBb,
      0xA299842FD0c72AE699b08d0AcCE721BB738f1fC0,
      0x3d5C5c7Bb9C44aa79Fe12A7B109647872E7d9102,
      0xf80Ca2E4D06eA5C4db581e7AfD5f3EAE9e21c9A1
    ];
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
