// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

interface IVM {
    function execute(bytes32[] calldata commands, bytes[] calldata state) external payable returns (bytes[] memory);
}

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
        address _VM,
        address _caller,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        if (VM != address(0)) revert AlreadyInit();
        if (_VM == address(0)) revert InvalidAddress();
        VM = _VM;
        caller = _caller;
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state)
        external
        payable
        returns (bytes[] memory returnData)
    {
        if (caller != msg.sender) revert NotCaller();
        returnData = _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] calldata state) internal returns (bytes[] memory) {
        return IVM(VM).execute(commands, state);
    }
}
