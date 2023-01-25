// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.16;

/**
 * @dev This contract is used to generate creation code for the BeaconClones contract
 *      it will not work if deployed as is
 */
contract BeaconProxyTemplate {
    fallback() external payable {
        // Use placeholder beacon
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x5c60da1b00000000000000000000000000000000000000000000000000000000)
            let status := staticcall(gas(), 0xBEbeBeBEbeBebeBeBEBEbebEBeBeBebeBeBebebe, ptr, 4, 0, 32)
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
