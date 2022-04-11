// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "./Archetype.sol";
// import "./OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Factory is OwnableUpgradeable {
  event CollectionAdded(address indexed sender, address indexed receiver, address collection);
  address public archetype;

  function initialize(address archetype_) public initializer {
    console.log("Factory is initializing");

    archetype = archetype_;
    __Ownable_init();

    console.log("archetype implementation is");
    console.log(archetype);
  }

  /// @notice config is a struct in the shape of {string placeholder; string base; uint64 supply; bool permanent;}
  function createCollection(
    address _receiver,
    string memory name,
    string memory symbol,
    Archetype.Config calldata config
  ) external payable returns (address) {
    console.log("archetype implementation");
    console.log(archetype);

    console.log("cloning the implementation");
    address clone = ClonesUpgradeable.clone(archetype);

    console.log("passing the clone to Archetype constructor");
    Archetype token = Archetype(clone);

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

  function setArchetype(address archetype_) public onlyOwner {
    archetype = archetype_;
  }
}
