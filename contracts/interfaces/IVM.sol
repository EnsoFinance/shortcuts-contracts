// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;


interface IVM {
    function execute(bytes32[] calldata commands, bytes[] calldata state) external payable returns (bytes[] memory);
}