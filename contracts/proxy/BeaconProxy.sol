// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract BeaconProxy {
    address private immutable BEACON;

    constructor(address beacon) {
        BEACON = beacon;
    }

    fallback() external payable {
        address beacon = BEACON;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x5c60da1b00000000000000000000000000000000000000000000000000000000)
            let status := staticcall(gas(), beacon, ptr, 4, 0, 32)
            if eq(status, 1) {
                let addr := mload(0)
                calldatacopy(0, 0, calldatasize())
                let result := delegatecall(gas(), addr, 0, calldatasize(), 0, 0)
                returndatacopy(0, 0, returndatasize())
                switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
            }
        }
    }
}
