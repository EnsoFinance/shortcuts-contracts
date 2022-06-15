// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;


contract MockVm {
    function execute(bytes32[] calldata commands, bytes[] calldata state) public returns (bytes[] memory) {
        emit VmData(commands, state);
        return state;
    }

    event VmData(bytes32[] commands, bytes[] state);
}

