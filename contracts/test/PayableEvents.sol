// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract PayableEvents {
    event LogBytes(bytes message);
    event LogString(string message);
    event LogBytes32(bytes32 message);
    event LogUint(uint256 message);

    function logBytes(bytes calldata message) external payable {
        emit LogBytes(message);
    }

    function logString(string calldata message) external payable {
        emit LogString(message);
    }

    function logBytes32(bytes32 message) external payable {
        emit LogBytes32(message);
    }

    function logUint(uint256 message) external payable {
        emit LogUint(message);
    }

    function logValue() external payable {
        emit LogUint(msg.value);
    }
}
