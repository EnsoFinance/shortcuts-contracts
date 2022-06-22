// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {IVM} from "./interfaces/IVM.sol";

contract Portal {
    address public caller;
    address public VM;

    // Already initialized
    error AlreadyInit();
    // Not caller
    error NotCaller();
    // Invalid address
    error InvalidAddress();

    function initialize(
        address VM_,
        address caller_,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        if (VM != address(0)) revert AlreadyInit();
        if (VM_ == address(0)) revert InvalidAddress();
        VM = VM_;
        caller = caller_;
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state)
        external
        payable
        returns (bytes[] memory returnData)
    {
        if (msg.sender != caller) revert NotCaller();
        returnData = _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] calldata state) internal returns (bytes[] memory) {
        return IVM(VM).execute(commands, state);
    }
}
