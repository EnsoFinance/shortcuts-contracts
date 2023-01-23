// SPDX-License-Identifier: GPL-3.0-only
// OpenZeppelin Contracts v4.4.1 (proxy/Clones.sol)
// Modified from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol

pragma solidity ^0.8.16;

library UpgradeableClones {
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /**
     * @dev Deploys and returns the address of a clone that stores an implementation
     * in state and mimics its behaviour.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert,
     * since the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, address salt) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x6080604052348015600f57600080fd5b50730000000000000000000000000000)
            mstore(add(ptr, 0x12), shl(0x60, implementation))
            mstore(add(ptr, 0x26), 0x7f00000000000000000000000000000000000000000000000000000000000000)
            mstore(add(ptr, 0x27), _IMPLEMENTATION_SLOT)
            mstore(add(ptr, 0x47), 0x556081806100556000396000f3fe60806040527f000000000000000000000000)
            mstore(add(ptr, 0x5b), _IMPLEMENTATION_SLOT)
            mstore(add(ptr, 0x7b), 0x543660008037600080366000845af490503d6000803e8080156046573d6000f3)
            mstore(add(ptr, 0x9b), 0x5b3d6000fdfea264697066735822122069639fe1c8c748ea5710f4706c1db531)
            mstore(add(ptr, 0xbb), 0xe16560df7fa1965479f51cafa674620b64736f6c634300081000330000000000)
            instance := create2(0, ptr, 0xd6, salt)
        }
        require(instance != address(0), "create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        address salt,
        address deployer
    ) internal pure returns (address predicted) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x6080604052348015600f57600080fd5b50730000000000000000000000000000)
            mstore(add(ptr, 0x12), shl(0x60, implementation))
            mstore(add(ptr, 0x26), 0x7f00000000000000000000000000000000000000000000000000000000000000)
            mstore(add(ptr, 0x27), _IMPLEMENTATION_SLOT)
            mstore(add(ptr, 0x47), 0x556081806100556000396000f3fe60806040527f000000000000000000000000)
            mstore(add(ptr, 0x5b), _IMPLEMENTATION_SLOT)
            mstore(add(ptr, 0x7b), 0x543660008037600080366000845af490503d6000803e8080156046573d6000f3)
            mstore(add(ptr, 0x9b), 0x5b3d6000fdfea264697066735822122069639fe1c8c748ea5710f4706c1db531)
            mstore(add(ptr, 0xbb), 0xe16560df7fa1965479f51cafa674620b64736f6c63430008100033ff00000000)
            mstore(add(ptr, 0xd7), shl(0x60, deployer))
            mstore(add(ptr, 0xeb), salt)
            mstore(add(ptr, 0x10b), keccak256(ptr, 0xd6))
            predicted := keccak256(add(ptr, 0xd6), 0x55)
        }
    }
}
