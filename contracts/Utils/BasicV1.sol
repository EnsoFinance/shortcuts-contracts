// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract BasicV1 {
    function getBalance(address balanceAddress) public view returns (uint256 balance) {
        return address(balanceAddress).balance;
    }
    
    function getBlockTimestamp() public view returns (uint256 timestamp) {
        return block.timestamp;
    }
}
