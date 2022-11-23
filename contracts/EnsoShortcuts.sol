// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@ensofinance/weiroll/contracts/VM.sol";
import "./permit2/libraries/Permit2Lib.sol";

contract EnsoShortcuts is VM {
    using Permit2Lib for ERC20;

    // @notice Execute a shortcut from this contract
    // @param commands An array of bytes32 values that encode calls
    // @param state An array of bytes that are used to generate call data for each command
    function executeShortcut(bytes32[] calldata commands, bytes[] calldata state)
        external
        returns (bytes[] memory returnData)
    {
        returnData = _execute(commands, state);
    }

    // @notice Execute a shortcut from this contract
    // @param commands An array of bytes32 values that encode calls
    // @param state An array of bytes that are used to generate call data for each command
    function permit2AndExecuteShortcut(
        ERC20 token,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external returns (bytes[] memory returnData) {
        token.permit2(
          msg.sender,
          address(this),
          amount,
          deadline,
          v,
          r,
          s
        );
        token.transferFrom2(msg.sender, address(this), amount);
        returnData = _execute(commands, state);
    }
}
