// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import {VM} from "@ensofinance/weiroll/contracts/VM.sol";

contract EnsoVM is VM {
    function execute(bytes32[] calldata commands, bytes[] memory state) public returns (bytes[] memory) {
        return _execute(commands, state);
    }
}
