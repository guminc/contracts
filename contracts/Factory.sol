// SPDX-License-Identifier: BUSL-1.1
// ERC-20 Factory v0.1
//
// ____    ____    ____                 ___       __       ____    ______  ____    ______  _____   ____    __    __ 
///\  _`\ /\  _`\ /\  _`\             /'___`\   /'__`\    /\  _`\ /\  _  \/\  _`\ /\__  _\/\  __`\/\  _`\ /\ \  /\ \
//\ \ \L\_\ \ \L\ \ \ \/\_\          /\_\ /\ \ /\ \/\ \   \ \ \L\_\ \ \L\ \ \ \/\_\/_/\ \/\ \ \/\ \ \ \L\ \ `\`\\/'/
// \ \  _\L\ \ ,  /\ \ \/_/_  _______\/_/// /__\ \ \ \ \   \ \  _\/\ \  __ \ \ \/_/_ \ \ \ \ \ \ \ \ \ ,  /`\ `\ /' 
//  \ \ \L\ \ \ \\ \\ \ \L\ \/\______\  // /_\ \\ \ \_\ \   \ \ \/  \ \ \/\ \ \ \L\ \ \ \ \ \ \ \_\ \ \ \\ \ `\ \ \ 
//   \ \____/\ \_\ \_\ \____/\/______/ /\______/ \ \____/    \ \_\   \ \_\ \_\ \____/  \ \_\ \ \_____\ \_\ \_\ \ \_\
//    \/___/  \/_/\/ /\/___/           \/_____/   \/___/      \/_/    \/_/\/_/\/___/    \/_/  \/_____/\/_/\/ /  \/_/
                                                                                                                  
                                                                                                                  
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function initialize(string memory name, string memory symbol, uint256 initialSupply, address owner) external;
}

contract ERC20Factory is Ownable, ReentrancyGuard {
    address[] public tokens;
    mapping(string => address) public implementations;
    uint256 public addImplementationFee = 1 ether; // Initial fee set to 1 ETH for example

    event TokenCreated(address tokenAddress);
    event ImplementationAdded(string name, address implementation);
    event FeeChanged(uint256 newFee);

    // Function to add a new ERC20 token implementation to the factory
    function addImplementation(string memory name, address implementation) public payable nonReentrant {
        require(msg.value >= addImplementationFee, "Insufficient fee");
        require(implementations[name] == address(0), "Implementation already exists");
        implementations[name] = implementation;
        emit ImplementationAdded(name, implementation);
    }

    // Function to create a new ERC20 token using a specified implementation
    function createToken(string memory implementationName, string memory name, string memory symbol, uint256 initialSupply, address owner) public {
        require(implementations[implementationName] != address(0), "Implementation does not exist");
        address clone = Clones.clone(implementations[implementationName]);
        IERC20(clone).initialize(name, symbol, initialSupply, owner);
        tokens.push(clone);
        emit TokenCreated(clone);
    }

    // Owner can update the fee for adding a new implementation
    function setAddImplementationFee(uint256 newFee) external onlyOwner {
        addImplementationFee = newFee;
        emit FeeChanged(newFee);
    }

    // Owner can withdraw the fees collected from adding new implementations
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Provide a list of all tokens created by the factory
    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    // Provide a list of all available implementations
    function getImplementations() public view returns (string[] memory) {
    string[] memory availableImplementations = new string[](tokens.length);
    for (uint i = 0; i < tokens.length; i++) {
        availableImplementations[i] = tokens[i];
    }
    return availableImplementations;
}

}
