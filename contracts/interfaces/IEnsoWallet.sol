// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IEnsoWallet {
    function caller() external returns(address);
    function initialized() external returns(bool);
    function initialize(
        address caller_,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable;

    function execute(bytes32[] calldata commands, bytes[] calldata state) external payable returns (bytes[] memory returnData);
}
