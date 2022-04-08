// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./F0.sol";

contract Factory is OwnableUpgradeable {
  event CollectionAdded(address indexed sender, address indexed receiver, address collection);
  address public f0;

  function initialize() public initializer {
    console.log("Factory is initializing");

    f0 = address(new F0());
    __Ownable_init();

    console.log("f0 implementation is");
    console.log(f0);
  }

  /********************************************************************************
   *
   * Create a collection with "name", "symbol" and "config",
   * and send it to "_receiver"
   *
   ********************************************************************************/
  function genesis(
    address _receiver,
    string memory name,
    string memory symbol,
    F0.Config calldata config
  ) external payable returns (address) {
    console.log("f0 implementation");
    console.log(f0);

    console.log("cloning the implementation");
    address clone = ClonesUpgradeable.clone(f0);

    console.log("passing the clone to F0 constructor");
    F0 token = F0(clone);

    console.log("calling initialize function with args");
    token.initialize(name, symbol, config);

    console.log("transferring ownership");

    token.transferOwnership(_receiver);
    if (msg.value > 0) {
      (bool sent, ) = payable(_receiver).call{ value: msg.value }("");
      require(sent, "1");
    }
    emit CollectionAdded(_msgSender(), _receiver, clone);
    return clone;
  }

  /********************************************************************************
   *
   * Pin collection to home page
   * only can be called by the collection owner
   *
   * when transferring ownership, the following needs to happen in this exact order:
   * 1. factory.addCollection() should be called first,
   * 2. call token.transferOwnership() called next
   *
   * Because once the ownership is transferred, only the owner can add to dashboard
   *
   * If the sender forgets to call factory.addCollection(),
   * the receiver needs to go to the collection page and call addCollection()
   * themselves to add to their dashboard
   *
   ********************************************************************************/
  function addCollection(address _receiver, address _collection) external {
    F0 token = F0(_collection);
    address _collectionOwner = token.owner();
    require(_msgSender() == _collectionOwner, "2");
    emit CollectionAdded(_msgSender(), _receiver, _collection);
  }
}
