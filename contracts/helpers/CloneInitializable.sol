// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

contract CloneInitializable {

   /**
     * @dev Modifier to protect an initializer function from being invoked twice.
     */
    modifier initializer() {
        bool initializing;
        bool initialized;
        bytes32 INITIALIZING_SLOT = bytes32(uint256(keccak256("_initializing")) - 1);
        bytes32 INITIALIZED_SLOT = bytes32(uint256(keccak256("_initialized")) - 1);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            initializing := sload(INITIALIZING_SLOT)
            initialized := sload(INITIALIZED_SLOT)
        }

        require(initializing || _isConstructor() || !initialized, "Initializable: contract is already initialized");

        bool isTopLevelCall = !initializing;
        if (isTopLevelCall) {
            
            bool _true = true;
            // solhint-disable-next-line no-inline-assembly
            assembly {
                // _initializing = true;

                sstore(INITIALIZING_SLOT, _true)

                // _initialized = true;

                sstore(INITIALIZED_SLOT, _true)

            }
        }

        _;

        if (isTopLevelCall) {

            bool _false = false;
            // solhint-disable-next-line no-inline-assembly
            assembly {

                //_initializing = false;

                sstore(INITIALIZING_SLOT, _false)

            }
        }
    }

    /// @dev Returns true if and only if the function is running in the constructor
    function _isConstructor() private view returns (bool) {
        // extcodesize checks the size of the code stored in an address, and
        // address returns the current address. Since the code is still not
        // deployed when running a constructor, any checks on its code size will
        // yield zero, making it an effective way to detect if a contract is
        // under construction or not.
        address self = address(this);
        uint256 cs;
        // solhint-disable-next-line no-inline-assembly
        assembly { cs := extcodesize(self) }
        return cs == 0;
    }
}
