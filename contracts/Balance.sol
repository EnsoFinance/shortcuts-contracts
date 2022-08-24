// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Balance {
    function getBalance(address balanceAddress) public view returns (uint256 balance) {
        return address(balanceAddress).balance;
    }
}