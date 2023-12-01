pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AlienMiladyFumo is ERC20 {
  constructor() ERC20("Alien Milady Fumo", "FUMO") {
    _mint(msg.sender, 500 * 10 ** 18);
  }

  function mint(uint256 quantity) public {
    _mint(msg.sender, quantity);
  }
}
