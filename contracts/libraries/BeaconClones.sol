// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (proxy/Clones.sol)
// Modified from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol

pragma solidity ^0.8.16;

library BeaconClones {
    /**
     * @dev Deploys and returns the address of a clone that gets an implementation from the `beacon` and mimics its behaviour.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address beacon, address salt) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x608060405234801561001057600080fd5b5061012b806100206000396000f3fe)
            mstore(add(ptr, 0x20), 0x608060405236601057600e6013565b005b600e5b600073000000000000000000)
            mstore(add(ptr, 0x37), shl(0x60, beacon))
            mstore(add(ptr, 0x4b),  0x73ffffffffffffffffffffffffffffffffffffffff16635c60da1b6040518163)
            mstore(add(ptr, 0x6b), 0xffffffff1660e01b8152600401602060405180830381865afa1580156073573d)
            mstore(add(ptr, 0x8b), 0x6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250)
            mstore(add(ptr, 0xab), 0x8101906095919060ba565b90503660008037600080366000845af43d6000803e)
            mstore(add(ptr, 0xcb), 0x80801560b5573d6000f35b3d6000fd5b60006020828403121560cb57600080fd)
            mstore(add(ptr, 0xeb), 0x5b815173ffffffffffffffffffffffffffffffffffffffff8116811460ee5760)
            mstore(add(ptr, 0x10b), 0x0080fd5b939250505056fea2646970667358221220463edf40eb5aaca3a0f037)
            mstore(add(ptr, 0x12b), 0xfa33f311a8ef51e6dade8fb9ebf0731da34434bf2f64736f6c63430008100033)
            instance := create2(0, ptr, 0x14b, salt)
        }
        require(instance != address(0), "create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {BeaconClones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address beacon,
        address salt
    ) internal pure returns (address predicted) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x608060405234801561001057600080fd5b5061012b806100206000396000f3fe)
            mstore(add(ptr, 0x20), 0x608060405236601057600e6013565b005b600e5b600073000000000000000000)
            mstore(add(ptr, 0x37), shl(0x60, beacon))
            mstore(add(ptr, 0x4b),  0x73ffffffffffffffffffffffffffffffffffffffff16635c60da1b6040518163)
            mstore(add(ptr, 0x6b), 0xffffffff1660e01b8152600401602060405180830381865afa1580156073573d)
            mstore(add(ptr, 0x8b), 0x6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250)
            mstore(add(ptr, 0xab), 0x8101906095919060ba565b90503660008037600080366000845af43d6000803e)
            mstore(add(ptr, 0xcb), 0x80801560b5573d6000f35b3d6000fd5b60006020828403121560cb57600080fd)
            mstore(add(ptr, 0xeb), 0x5b815173ffffffffffffffffffffffffffffffffffffffff8116811460ee5760)
            mstore(add(ptr, 0x10b), 0x0080fd5b939250505056fea2646970667358221220463edf40eb5aaca3a0f037)
            mstore(add(ptr, 0x12b), 0xfa33f311a8ef51e6dade8fb9ebf0731da34434bf2f64736f6c63430008100033)
            mstore(add(ptr, 0x14b), 0xff00000000000000000000000000000000000000000000000000000000000000)
            mstore(add(ptr, 0x14c), shl(0x60, beacon))
            mstore(add(ptr, 0x160), salt)
            mstore(add(ptr, 0x180), keccak256(ptr, 0x14b))
            predicted := keccak256(add(ptr, 0x14b), 0x55)
        }
    }
}
