// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockERC1155 is ERC1155 {
    constructor(string memory uri_) ERC1155(uri_) {
        _mint(msg.sender, 0, 1, "");
        _mint(msg.sender, 1, 10, "");
        _mint(msg.sender, 2, 100, "");
    }
}
