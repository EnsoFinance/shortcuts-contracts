// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;


contract MockVM {
    address public lastSender;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint value);

    function execute(bytes32[] calldata commands, bytes[] calldata state) public payable returns (bytes[] memory) {
        lastSender = msg.sender;
        emit VMData(commands, state);
        emit SenderData(msg.sender, msg.value);
        return state;
    }
}

