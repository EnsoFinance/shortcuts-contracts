// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../interfaces/IOwnable.sol";

contract OwnershipTester {
    function acceptOwnership(address ownable) external {
        IOwnable(ownable).acceptOwnership();
    }
}
