// SPDX-License-Identifier: MIT
// ArchetypeLogic v0.5.1
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

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "solady/src/utils/ECDSA.sol";

error InvalidConfig();
error MintEnded();
error MaxSupplyExceeded();
error NotTokenOwner();
error NotPlatform();
error WrongPassword();
error LockedForever();
error NotAuctionHouse();

//
// STRUCTS
//

struct Config {
  string baseUri;
  address ownerAltPayout; // optional alternative address for owner withdrawals.
  address superAffiliatePayout; // optional super affiliate address, will receive half of platform fee if set.
  uint32 maxSupply;
  uint16 platformFee; //BPS
  uint16 defaultRoyalty; //BPS
  address auctionHouse;
}

struct Options {
  bool uriLocked;
  bool maxSupplyLocked;
  bool ownerAltPayoutLocked;
  bool royaltyEnforcementEnabled;
  bool royaltyEnforcementLocked;
  bool auctionHouseLocked;
  bool mintLocked;
}

address constant PLATFORM = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // TEST (account[2])
// address private constant PLATFORM = 0x86B82972282Dd22348374bC63fd21620F7ED847B;
uint16 constant MAXBPS = 5000; // max fee or discount is 50%
