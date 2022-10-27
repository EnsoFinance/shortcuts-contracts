// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IOwnable{
    function acceptOwnership() external;
}

contract OwnershipTester {
    function acceptOwnership(address ownable) external {
        IOwnable(ownable).acceptOwnership();
    }
}
