// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.16;

interface IBeacon {
    function implementation() external view returns (address);
}

contract Proxy {
    IBeacon public immutable beacon;

    constructor() {
        beacon = IBeacon(msg.sender);
    }

    /**
     * @dev Delegates the current call to `implementation`.
     *
     * This function does not return to its internal call site, it will return directly to the external caller.
     */
    function _delegate() internal virtual {
        address implementation = beacon.implementation();
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `beacon.implementation()`. Will run if no other
     * function in the contract matches the call data.
     */
    fallback() external payable virtual {
        _delegate();
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `beacon.implementation()`. Will run if call data
     * is empty.
     */
    receive() external payable virtual {
        _delegate();
    }
}
