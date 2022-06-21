// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;


contract MockVm {
    address public lastSender;

    function execute(bytes32[] calldata commands, bytes[] calldata state) public payable returns (bytes[] memory) {
        lastSender = msg.sender;
        emit VmData(commands, state);
        emit SenderData(msg.sender, msg.value);
        return state;
    }

    event VmData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint value);
}

