// SPDX-License-Identifier: MIT
// ArchetypeLogic v0.7.1 - ERC1155-random
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
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
error TokenPoolEmpty();
error NumberOfMintsExceeded();
error MintingPaused();
error InvalidReferral();
error InvalidSignature();
error MaxBatchSizeExceeded();
error NotTokenOwner();
error NotPlatform();
error NotOwner();
error NotShareholder();
error NotApprovedToTransfer();
error InvalidAmountOfTokens();
error WrongPassword();
error LockedForever();
error URIQueryForNonexistentToken();
error InvalidTokenId();
error MintToZeroAddress();
error InvalidSeed();
error SeedHashAlreadyExists();

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
  address fulfillmentSigner;
  uint32 maxSupply;
  uint16 maxBatchSize;
  uint16 affiliateFee; //BPS
  uint16 defaultRoyalty; //BPS
  Discount discounts;
  uint16[] tokenPool; // flattened list of all mintable tokens
}

struct PayoutConfig {
  uint16 ownerBps;
  uint16 platformBps;
  uint16 partnerBps;
  uint16 superAffiliateBps;
  uint16 superAffiliateTwoBps;
  address partner;
  address superAffiliate;
  address superAffiliateTwo;
}

struct Options {
  bool uriLocked;
  bool maxSupplyLocked;
  bool tokenPoolLocked;
  bool affiliateFeeLocked;
  bool discountsLocked;
  bool ownerAltPayoutLocked;
  bool provenanceHashLocked;
  bool airdropLocked;
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
  uint16[] tokenIdsExcluded; // token ids excluded from this list
}

struct Invite {
  uint128 price;
  uint32 start;
  uint32 end;
  uint32 limit;
  uint32 maxSupply;
  uint32 unitSize; // mint 1 get x
  address tokenAddress;
  uint16[] tokenIdsExcluded; // token ids excluded from this list
}

struct ValidationArgs {
  address owner;
  address affiliate;
  uint256 quantity;
  uint256 curSupply;
  uint256 listSupply;
}

struct MintInfo {
  bytes32 key;
  address to;
  uint256 quantity;
  uint256 blockNumber;
}

address constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
address constant BATCH = 0xEa49e7bE310716dA66725c84a5127d2F6A202eAf;
address constant PAYOUTS = 0xaAfdfA4a935d8511bF285af11A0544ce7e4a1199;
uint16 constant MAXBPS = 5000; // max fee or discount is 50%
uint32 constant UINT32_MAX = 2**32 - 1;

library ArchetypeLogic {
  //
  // EVENTS
  //
  event Invited(bytes32 indexed key, bytes32 indexed cid);
  event Referral(address indexed affiliate, address token, uint128 wad, uint256 numMints);
  event Withdrawal(address indexed src, address token, uint128 wad);
  event RequestRandomness(uint256 indexed seedHash);

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
    mapping(bytes32 => uint256) storage listSupply,
    bytes calldata signature,
    ValidationArgs memory args,
    uint256 cost
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

      if (i.maxSupply < UINT32_MAX) {
        totalAfterMint = listSupply[auth.key] + args.quantity;
        if (totalAfterMint > i.maxSupply) {
          revert ListMaxSupplyExceeded();
        }
      }
    }

    if (args.quantity > config.maxBatchSize) {
      revert MaxBatchSizeExceeded();
    }

    if ((args.curSupply + args.quantity) > config.maxSupply) {
      revert MaxSupplyExceeded();
    }

    if (args.quantity > config.tokenPool.length) {
      revert TokenPoolEmpty();
    }

    if (i.tokenAddress != address(0)) {
      IERC20 erc20Token = IERC20(i.tokenAddress);
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
      IERC20 erc20Token = IERC20(tokenAddress);
      bool success = erc20Token.transferFrom(_msgSender(), address(this), value);
      if (!success) {
        revert TransferFailed();
      }
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
        IERC20 erc20Token = IERC20(tokenAddress);
        bool success = erc20Token.transfer(msgSender, wad);
        if (!success) {
          revert TransferFailed();
        }
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

      address[] memory recipients = new address[](5);
      recipients[0] = owner;
      recipients[1] = PLATFORM;
      recipients[2] = payoutConfig.partner;
      recipients[3] = payoutConfig.superAffiliate;
      recipients[4] = payoutConfig.superAffiliateTwo;

      uint16[] memory splits = new uint16[](5);
      splits[0] = payoutConfig.ownerBps;
      splits[1] = payoutConfig.platformBps;
      splits[2] = payoutConfig.partnerBps;
      splits[3] = payoutConfig.superAffiliateBps;
      splits[4] = payoutConfig.superAffiliateTwoBps;

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

  function validateFulfillment(
    uint256 seed,
    bytes calldata signature,
    address fulfillmentSigner
  ) public view {
    bytes32 signedMessageHash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(seed)));
    address signer = ECDSA.recover(signedMessageHash, signature);

    if (signer != fulfillmentSigner) {
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
    uint16[] memory tokenIdsExcluded,
    uint256 quantity,
    uint256 seed
  ) public returns (uint16[] memory) {
    uint16[] memory tokenIds = new uint16[](quantity);

    uint256 retries = 0;
    uint256 MAX_RETRIES = 10;

    uint256 i = 0;
    while (i < quantity) {
      if (tokenPool.length == 0) {
        revert MaxSupplyExceeded();
      }

      uint256 rand = uint256(keccak256(abi.encode(seed, i)));
      uint256 randIdx = rand % tokenPool.length;
      uint16 selectedToken = tokenPool[randIdx];

      if (
        retries < MAX_RETRIES &&
        tokenIdsExcluded.length > 0 &&
        isExcluded(selectedToken, tokenIdsExcluded)
      ) {
        // If the token is excluded, retry for this position in tokenIds array
        // If after 10 retries it still hasn't found a non-excluded token, use whatever token is selected even if it's excluded.
        seed = rand; // Update the seed for the next iteration
        retries++;
        continue;
      }

      tokenIds[i] = selectedToken;

      // remove token from pool
      tokenPool[randIdx] = tokenPool[tokenPool.length - 1];
      tokenPool.pop();

      retries = 0;
      i++;
    }

    return tokenIds;
  }

  function isExcluded(uint16 tokenId, uint16[] memory excludedList) internal pure returns (bool) {
    for (uint256 i = 0; i < excludedList.length; i++) {
      if (tokenId == excludedList[i]) {
        return true;
      }
    }
    return false;
  }

  function random() public view returns (uint256) {
    uint256 randomHash = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));
    return randomHash;
  }

  function _msgSender() internal view returns (address) {
    return msg.sender == BATCH ? tx.origin : msg.sender;
  }
}
