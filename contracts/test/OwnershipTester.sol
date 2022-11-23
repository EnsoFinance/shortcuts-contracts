// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IOwnable.sol";

interface IBeaconAdmin {
    function acceptAdministration() external;
    function acceptDelegation() external;
}

contract OwnershipTester {
    function acceptOwnership(address ownable) external {
        IOwnable(ownable).acceptOwnership();
    }

    function acceptAdministration(address beacon) external {
        IBeaconAdmin(beacon).acceptAdministration();
    }

    function acceptDelegation(address beacon) external {
        IBeaconAdmin(beacon).acceptDelegation();
    }
}
