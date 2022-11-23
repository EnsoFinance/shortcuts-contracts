// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IEnsoWallet {
    function initialize(
        address owner,
        bytes32 salt,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable;
}
