// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ERC20Token is ERC20Upgradeable, OwnableUpgradeable {
    function __ERC20Token_init(string memory _name, string memory _symbol)
        public
        initializer
    {
        __ERC20_init(_name, _symbol);
        __Ownable_init();
    }

    function mint(address recipient, uint256 _amount) public onlyOwner {
        _mint(recipient, _amount);
    }
}
