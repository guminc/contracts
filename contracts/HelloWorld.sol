// SPDX-License-Identifier: MIT
// Creator: Scatter
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HelloWorld is Ownable {
  string public greet;

  constructor(string memory name) {
    greet = string(abi.encodePacked("Hello My Good World, ", name));
  }
}
