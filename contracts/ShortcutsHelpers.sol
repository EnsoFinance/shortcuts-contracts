// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract EnsoShortcutsHelper {
    uint256 public constant VERSION = 2;

    function getBalance(address balanceAddress) external view returns (uint256 balance) {
        return address(balanceAddress).balance;
    }

    function getBlockTimestamp() external view returns (uint256 timestamp) {
        return block.timestamp;
    }

    function bytesToString(bytes calldata input) external pure returns (string memory) {
        return string(abi.encodePacked(input));
    }

    function bytes32ToUint256(bytes32 input) external pure returns (uint256) {
        return uint256(input);
    }

    function bytes32ToAddress(bytes32 input) external pure returns (address) {
        return address(uint160(uint256(input)));
    }

    function uint256ToInt256(uint256 value) public pure returns (int256) {
        require(value <= uint256(type(int256).max), "Value does not fit in an int256");
        return int256(value);
    }

    function int256ToUint256(int256 value) public pure returns (uint256) {
        require(value >= 0, "Value must be positive");
        return uint256(value);
    }

    function max(uint256 a, uint256 b) external pure returns (uint256) {
        return a >= b ? a : b;
    }

    function min(uint256 a, uint256 b) external pure returns (uint256) {
        return a < b ? a : b;
    }

    function average(uint256 a, uint256 b) external pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }

    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return a + b;
    }

    function sub(uint256 a, uint256 b) external pure returns (uint256) {
        return a - b;
    }

    function mul(uint256 a, uint256 b) external pure returns (uint256) {
        return a * b;
    }

    function div(uint256 a, uint256 b) external pure returns (uint256) {
        return a / b;
    }

    function mod(uint256 a, uint256 b) external pure returns (uint256) {
        return a % b;
    }
}
