// SPDX-License-Identifier: MIT
// ArchetypeLogic v0.7.0
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

import "./ArchetypePayouts.sol";
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
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
error MaxBatchSizeExceeded();
error BurnToMintDisabled();
error NotTokenOwner();
error NotPlatform();
error NotOwner();
error NotShareholder();
error NotApprovedToTransfer();
error InvalidAmountOfTokens();
error WrongPassword();
error LockedForever();
error Blacklisted();

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
  uint32 maxSupply;
  uint32 maxBatchSize;
  uint16 affiliateFee; //BPS
  uint16 defaultRoyalty; //BPS
  Discount discounts;
}

struct PayoutConfig {
  uint16 ownerBps;
  uint16 platformBps;
  uint16 partnerBps;
  uint16 superAffiliateBps;
  address partner;
  address superAffiliate;
}

struct Options {
  bool uriLocked;
  bool maxSupplyLocked;
  bool affiliateFeeLocked;
  bool discountsLocked;
  bool ownerAltPayoutLocked;
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
  address tokenAddress;
  bool isBlacklist;
}

struct Invite {
  uint128 price;
  uint32 start;
  uint32 end;
  uint32 limit;
  uint32 maxSupply;
  uint32 unitSize; // mint 1 get x
  address tokenAddress;
  bool isBlacklist;
}

struct BurnConfig {
  IERC721AUpgradeable archetype;
  address burnAddress;
  bool enabled;
  bool reversed; // side of the ratio (false=burn {ratio} get 1, true=burn 1 get {ratio})
  uint16 ratio;
  uint64 start;
  uint64 limit;
}

struct ValidationArgs {
  address owner;
  address affiliate;
  uint256 quantity;
  uint256 curSupply;
  uint256 listSupply;
}

address constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
address constant BATCH = 0x6Bc558A6DC48dEfa0e7022713c23D65Ab26e4Fa7;
// update to prod
address constant PAYOUTS = 0x31810331b5Edf34991ce7868f991ce79F9a51128;
uint16 constant MAXBPS = 5000; // max fee or discount is 50%
uint32 constant UINT32_MAX = 2**32 - 1;

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
    uint256 listSupply,
    bool affiliateUsed
  ) public view returns (uint256) {
    uint256 price = invite.price;
    uint256 cost;
    if (invite.interval > 0 && invite.delta > 0) {
      // Apply dutch pricing
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
      cost = price * numTokens;
    } else if (invite.interval == 0 && invite.delta > 0) {
      // Apply linear curve
      uint256 lastPrice = price + invite.delta * listSupply;
      cost = lastPrice * numTokens + (invite.delta * numTokens * (numTokens - 1)) / 2;
    } else {
      cost = price * numTokens;
    }

    if (affiliateUsed) {
      cost = cost - ((cost * discounts.affiliateDiscount) / 10000);
    }

    uint256 numMints = discounts.mintTiers.length;
    for (uint256 i; i < numMints; ) {
      uint256 tierNumMints = discounts.mintTiers[i].numMints;
      if (numTokens >= tierNumMints) {
        return cost - ((cost * discounts.mintTiers[i].mintDiscount) / 10000);
      }
      unchecked {
        ++i;
      }
    }
    return cost;
  }

  function validateMint(
    DutchInvite storage i,
    Config storage config,
    Auth calldata auth,
    mapping(address => mapping(bytes32 => uint256)) storage minted,
    bytes calldata signature,
    ValidationArgs memory args,
    uint128 cost
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

    if (!i.isBlacklist) {
      if (!verify(auth, i.tokenAddress, msgSender)) {
        revert WalletUnauthorizedToMint();
      }
    } else {
      if (verify(auth, i.tokenAddress, msgSender)) {
        revert Blacklisted();
      }
    }

    if (block.timestamp < i.start) {
      revert MintNotYetStarted();
    }

    if (i.end > i.start && block.timestamp > i.end) {
      revert MintEnded();
    }

    if (i.limit < i.maxSupply) {
      uint256 totalAfterMint = minted[msgSender][auth.key] + args.quantity;

      if (totalAfterMint > i.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if (i.maxSupply < config.maxSupply) {
      uint256 totalAfterMint = args.listSupply + args.quantity;
      if (totalAfterMint > i.maxSupply) {
        revert ListMaxSupplyExceeded();
      }
    }

    if (args.quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if ((args.curSupply + args.quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

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
    }
  }

  function validateBurnToMint(
    Config storage config,
    BurnConfig storage burnConfig,
    uint256[] calldata tokenIds,
    uint256 curSupply,
    mapping(address => mapping(bytes32 => uint256)) storage minted
  ) public view {
    if (!burnConfig.enabled) {
      revert BurnToMintDisabled();
    }

    if (block.timestamp < burnConfig.start) {
      revert MintNotYetStarted();
    }

    // check if msgSender owns tokens and has correct approvals
    address msgSender = _msgSender();
    for (uint256 i; i < tokenIds.length; ) {
      if (burnConfig.archetype.ownerOf(tokenIds[i]) != msgSender) {
        revert NotTokenOwner();
      }
      unchecked {
        ++i;
      }
    }

    if (!burnConfig.archetype.isApprovedForAll(msgSender, address(this))) {
      revert NotApprovedToTransfer();
    }

    uint256 quantity;
    if (burnConfig.reversed) {
      quantity = tokenIds.length * burnConfig.ratio;
    } else {
      if (tokenIds.length % burnConfig.ratio != 0) {
        revert InvalidAmountOfTokens();
      }
      quantity = tokenIds.length / burnConfig.ratio;
    }

    if (quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if (burnConfig.limit < config.maxSupply) {
      uint256 totalAfterMint = minted[msgSender][bytes32("burn")] + quantity;

      if (totalAfterMint > burnConfig.limit) {
        revert NumberOfMintsExceeded();
      }
    }

    if ((curSupply + quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }
  }

  function updateBalances(
    DutchInvite storage i,
    Config storage config,
    mapping(address => uint128) storage _ownerBalance,
    mapping(address => mapping(address => uint128)) storage _affiliateBalance,
    address affiliate,
    uint256 quantity,
    uint128 value
  ) public {
    address tokenAddress = i.tokenAddress;

    uint128 affiliateWad;
    if (affiliate != address(0)) {
      affiliateWad = (value * config.affiliateFee) / 10000;
      _affiliateBalance[affiliate][tokenAddress] += affiliateWad;
      emit Referral(affiliate, tokenAddress, affiliateWad, quantity);
    }

    uint128 balance = _ownerBalance[tokenAddress];
    uint128 ownerWad = value - affiliateWad;
    _ownerBalance[tokenAddress] = balance + ownerWad;

    if (tokenAddress != address(0)) {
      IERC20Upgradeable erc20Token = IERC20Upgradeable(tokenAddress);
      erc20Token.transferFrom(_msgSender(), address(this), value);
    }
  }

  function withdrawTokensAffiliate(
    mapping(address => mapping(address => uint128)) storage _affiliateBalance,
    address[] calldata tokens
  ) public {
    address msgSender = _msgSender();

    for (uint256 i; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      uint128 wad = _affiliateBalance[msgSender][tokenAddress];
      _affiliateBalance[msgSender][tokenAddress] = 0;

      if (wad == 0) {
        revert BalanceEmpty();
      }

      if (tokenAddress == address(0)) {
        bool success = false;
        (success, ) = msgSender.call{ value: wad }("");
        if (!success) {
          revert TransferFailed();
        }
      } else {
        IERC20Upgradeable erc20Token = IERC20Upgradeable(tokenAddress);
        erc20Token.transfer(msgSender, wad);
      }

      emit Withdrawal(msgSender, tokenAddress, wad);
    }
  }

  function withdrawTokens(
    PayoutConfig storage payoutConfig,
    mapping(address => uint128) storage _ownerBalance,
    address owner,
    address[] calldata tokens
  ) public {
    address msgSender = _msgSender();
    for (uint256 i; i < tokens.length; i++) {
      address tokenAddress = tokens[i];
      uint128 wad;

      if (
        msgSender == owner ||
        msgSender == PLATFORM ||
        msgSender == payoutConfig.partner ||
        msgSender == payoutConfig.superAffiliate
      ) {
        wad = _ownerBalance[tokenAddress];
        _ownerBalance[tokenAddress] = 0;
      } else {
        revert NotShareholder();
      }

      if (wad == 0) {
        revert BalanceEmpty();
      }

      address[] memory recipients = new address[](4);
      recipients[0] = owner;
      recipients[1] = PLATFORM;
      recipients[2] = payoutConfig.partner;
      recipients[3] = payoutConfig.superAffiliate;

      uint16[] memory splits = new uint16[](4);
      splits[0] = payoutConfig.ownerBps;
      splits[1] = payoutConfig.platformBps;
      splits[2] = payoutConfig.partnerBps;
      splits[3] = payoutConfig.superAffiliateBps;

      if (tokenAddress == address(0)) {
        ArchetypePayouts(PAYOUTS).updateBalances{ value: wad }(
          wad,
          tokenAddress,
          recipients,
          splits
        );
      } else {
        ArchetypePayouts(PAYOUTS).updateBalances(wad, tokenAddress, recipients, splits);
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

  function _msgSender() internal view returns (address) {
    return msg.sender == BATCH ? tx.origin : msg.sender;
  }
}
