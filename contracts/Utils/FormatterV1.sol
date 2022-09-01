// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract FormatterV1 {
    function bytesToString(bytes calldata input) public pure returns (string memory) {
        return string(abi.encodePacked(input));
    }

    function bytes32ToUint256(bytes32 input) public pure returns (uint256) {
        return uint256(input);
    }

    function bytes32ToAddress(bytes32 input) public pure returns (address) {
        return address(uint160(uint256(input)));
    }
}