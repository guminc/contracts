// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract TestErc20 is ERC20 {
    constructor() ERC20("TestErc20", "ERC20") {}
    
    function mint(uint256 amount) public {
        _mint(msg.sender, amount * 10**18);
    }
} 