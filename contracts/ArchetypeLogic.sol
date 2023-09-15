// SPDX-License-Identifier: MIT
// ArchetypeLogic v0.6.0 - ERC1155-random
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

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "solady/src/utils/MerkleProofLib.sol";
import "solady/src/utils/ECDSA.sol";

error InvalidConfig();
error MintNotYetStarted();
error MintEnded();
error WalletUnauthorizedToMint();
error InsufficientEthSent();
error ExcessiveEthSent();
error Erc20BalanceTooLow();
error MaxSupplyExceeded();
error ListMaxSupplyExceeded();
error NumberOfMintsExceeded();
error MintingPaused();
error InvalidReferral();
error InvalidSignature();
error BalanceEmpty();
error TransferFailed();
error MaxBatchSizeExceeded();
error BurnToMintDisabled();
error NotTokenOwner();
error NotPlatform();
error NotOwner();
error NotVRF();
error NotApprovedToTransfer();
error InvalidAmountOfTokens();
error WrongPassword();
error LockedForever();
error URIQueryForNonexistentToken();
error InvalidTokenId();
error NotSupported();
error InsufficientLink();

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
  Discount discounts;
  uint16[] tokenPool; // flattened address of all mintable tokens
  uint16 maxBatchSize;
  uint16 affiliateFee; //BPS
  uint16 platformFee; //BPS
  uint16 defaultRoyalty; //BPS
}

struct Options {
  bool uriLocked;
  bool tokenPoolLocked;
  bool affiliateFeeLocked;
  bool discountsLocked;
  bool ownerAltPayoutLocked;
  bool provenanceHashLocked;
  bool useChainlinkVRF;
}

struct DutchInvite {
  uint128 price;
  uint128 reservePrice;
  uint128 delta;
  uint32 start;
  uint32 end;
  uint32 limit;
  uint32 maxSupply;
  uint32 interval;
  uint32 unitSize; // mint 1 get x
  uint16[] tokenIds; // token id mintable from this list, TODO: implement/remove
  address tokenAddress;
}

struct Invite {
  uint128 price;
  uint32 start;
  uint32 end;
  uint32 limit;
  uint32 maxSupply;
  uint32 unitSize; // mint 1 get x
  uint16[] tokenIds; // token ids mintable from this list, TODO: implement/remove
  address tokenAddress;
}

struct OwnerBalance {
  uint128 owner;
  uint128 platform;
}

struct ValidationArgs {
  address owner;
  address affiliate;
  uint256 quantity;
}

struct VrfMintInfo {
  address to;
  uint256 quantity;
}

address constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
address constant BATCH = 0x6Bc558A6DC48dEfa0e7022713c23D65Ab26e4Fa7;
uint16 constant MAXBPS = 5000; // max fee or discount is 50%
// vrf sepolia
address constant VRF_CORDINATOR = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;
bytes32 constant VRF_KEYHASH = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
address constant LINK = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
// vrf mainnet
// address constant VRF_CORDINATOR = 0x271682DEB8C4E0901D1a1550aD2e64D568E69909;
// bytes32 constant VRF_KEYHASH = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
// address constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;

library ArchetypeLogic {
  //
  // EVENTS
  //
  event Invited(bytes32 indexed key, bytes32 indexed cid);
  event Referral(address indexed affiliate, address token, uint128 wad, uint256 numMints);
  event Withdrawal(address indexed src, address token, uint128 wad);

  // calculate price based on affiliate usage and mint discounts
  function computePrice(
    DutchInvite storage invite,
    Discount storage discounts,
    uint256 numTokens,
    bool affiliateUsed
  ) public view returns (uint256) {
    uint256 price = invite.price;
    if (invite.interval != 0) {
      uint256 diff = (((block.timestamp - invite.start) / invite.interval) * invite.delta);
      if (price > invite.reservePrice) {
        if (diff > price - invite.reservePrice) {
          price = invite.reservePrice;
        } else {
          price = price - diff;
        }
      } else if (price < invite.reservePrice) {
        if (diff > invite.reservePrice - price) {
          price = invite.reservePrice;
        } else {
          price = price + diff;
        }
      }
    }

    uint256 cost = price * numTokens;

    if (affiliateUsed) {
      cost = cost - ((cost * discounts.affiliateDiscount) / 10000);
    }

    for (uint256 i = 0; i < discounts.mintTiers.length; i++) {
      if (numTokens >= discounts.mintTiers[i].numMints) {
        return cost = cost - ((cost * discounts.mintTiers[i].mintDiscount) / 10000);
      }
    }
    return cost;
  }

  function validateMint(
    DutchInvite storage i,
    Config storage config,
    Auth calldata auth,
    mapping(address => mapping(bytes32 => uint256)) storage minted,
    mapping(bytes32 => uint256) storage listSupply,
    bytes calldata signature,
    ValidationArgs memory args
  ) public view {
    address msgSender = _msgSender();
    if (args.affiliate != address(0)) {
      if (
        args.affiliate == PLATFORM || args.affiliate == args.owner || args.affiliate == msgSender
      ) {
        revert InvalidReferral();
      }
      validateAffiliate(args.affiliate, signature, config.affiliateSigner);
    }

    if (i.limit == 0) {
      revert MintingPaused();
    }

    if (!verify(auth, i.tokenAddress, msgSender)) {
      revert WalletUnauthorizedToMint();
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted();
    }

    if (i.end > i.start && block.timestamp > i.end) {
      revert MintEnded();
    }

    {
      uint256 totalAfterMint;
      if (i.limit < i.maxSupply) {
        totalAfterMint = minted[msgSender][auth.key] + args.quantity;

        if (totalAfterMint > i.limit) {
          revert NumberOfMintsExceeded();
        }
      }

      if (i.maxSupply < 2**32 - 1) {
        totalAfterMint = listSupply[auth.key] + args.quantity;
        if (totalAfterMint > i.maxSupply) {
          revert ListMaxSupplyExceeded();
        }
      }
    }

    if (args.quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    uint256 cost = computePrice(i, config.discounts, args.quantity, args.affiliate != address(0));

    if (i.tokenAddress != address(0)) {
      IERC20Upgradeable erc20Token = IERC20Upgradeable(i.tokenAddress);
      if (erc20Token.allowance(msgSender, address(this)) < cost) {
        revert NotApprovedToTransfer();
      }

      if (erc20Token.balanceOf(msgSender) < cost) {
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

  function updateBalances(
    DutchInvite storage i,
    Config storage config,
    mapping(address => OwnerBalance) storage _ownerBalance,
    mapping(address => mapping(address => uint128)) storage _affiliateBalance,
    address affiliate,
    uint256 quantity
  ) public {
    address tokenAddress = i.tokenAddress;
    uint128 value = uint128(msg.value);
    if (tokenAddress != address(0)) {
      value = uint128(computePrice(i, config.discounts, quantity, affiliate != address(0)));
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
      erc20Token.transferFrom(_msgSender(), address(this), value);
    }
  }

  function withdrawTokens(
    Config storage config,
    mapping(address => OwnerBalance) storage _ownerBalance,
    mapping(address => mapping(address => uint128)) storage _affiliateBalance,
    address owner,
    address[] calldata tokens
  ) public {
    address msgSender = _msgSender();
    for (uint256 i = 0; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      uint128 wad = 0;

      if (msgSender == owner || msgSender == config.ownerAltPayout || msgSender == PLATFORM) {
        OwnerBalance storage balance = _ownerBalance[tokenAddress];
        if (msgSender == owner || msgSender == config.ownerAltPayout) {
          wad = balance.owner;
          balance.owner = 0;
        } else {
          wad = balance.platform;
          balance.platform = 0;
        }
      } else {
        wad = _affiliateBalance[msgSender][tokenAddress];
        _affiliateBalance[msgSender][tokenAddress] = 0;
      }

      if (wad == 0) {
        revert BalanceEmpty();
      }

      if (tokenAddress == address(0)) {
        bool success = false;
        // send to ownerAltPayout if set and owner is withdrawing
        if (msgSender == owner && config.ownerAltPayout != address(0)) {
          (success, ) = payable(config.ownerAltPayout).call{ value: wad }("");
        } else {
          (success, ) = msgSender.call{ value: wad }("");
        }
        if (!success) {
          revert TransferFailed();
        }
      } else {
        IERC20Upgradeable erc20Token = IERC20Upgradeable(tokenAddress);

        if (msgSender == owner && config.ownerAltPayout != address(0)) {
          erc20Token.transfer(config.ownerAltPayout, wad);
        } else {
          erc20Token.transfer(msgSender, wad);
        }
      }
      emit Withdrawal(msgSender, tokenAddress, wad);
    }
  }

  function validateAffiliate(
    address affiliate,
    bytes calldata signature,
    address affiliateSigner
  ) public view {
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
  ) public pure returns (bool) {
    // keys 0-255 and tokenAddress are public
    if (uint256(auth.key) <= 0xff || auth.key == keccak256(abi.encodePacked(tokenAddress))) {
      return true;
    }

    return MerkleProofLib.verify(auth.proof, auth.key, keccak256(abi.encodePacked(account)));
  }

  function getRandomTokenIds(
    uint16[] storage tokenPool,
    uint256 quantity,
    uint256 seed
  ) public returns (uint16[] memory) {
    uint16[] memory tokenIds = new uint16[](quantity);

    for (uint256 i = 0; i < quantity; i++) {
      if (tokenPool.length == 0) {
        revert MaxSupplyExceeded();
      }
      uint256 rand = uint256(keccak256(abi.encode(seed, i)));
      uint256 randIdx = rand % tokenPool.length;
      tokenIds[i] = tokenPool[randIdx];

      // remove token from pool
      tokenPool[randIdx] = tokenPool[tokenPool.length - 1];
      tokenPool.pop();
    }
    return tokenIds;
  }

  function random() public view returns (uint256) {
    uint256 randomHash = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
    return randomHash;
  }

  function _msgSender() internal view returns (address) {
    return msg.sender == BATCH? tx.origin: msg.sender;
  }
}
