// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

contract CloneInitializable {

   /**
     * @dev Modifier to protect an initializer function from being invoked twice.
     */
    modifier initializer() {
        bool initialized;
        bytes32 INITIALIZED_SLOT = bytes32(uint256(keccak256("_initialized")) - 1);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            initialized := sload(INITIALIZED_SLOT)
        }

        require(!initialized, "Initializable: contract is already initialized");

        bool _true = true;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // _initialized = true;
            sstore(INITIALIZED_SLOT, _true)
        }

        _;
    }
}
