// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

library PortalErrors {
    // Already initialized
    error AlreadyInit();
    // Not caller
    error NotCaller();
    // Invalid address
    error InvalidAddress();
}

interface IVM {
    function execute(bytes32[] calldata commands, bytes[] memory state) external returns (bytes[] memory);
}

contract Portal {
    address public caller;
    address public VM;

    function initialize(
        address _VM,
        address _caller,
        bytes32[] calldata commands,
        bytes[] memory state
    ) external payable {
        if (VM != address(0)) revert PortalErrors.AlreadyInit();
        if (_VM == address(0)) revert PortalErrors.InvalidAddress();
        VM = _VM;
        caller = _caller;
        _execute(commands, state);
    }

    function execute(bytes32[] calldata commands, bytes[] memory state) external payable returns (bytes[] memory) {
        if (caller != msg.sender) revert PortalErrors.NotCaller();

        return _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] memory state) internal returns (bytes[] memory) {
        (bool success, bytes memory data) = VM.delegatecall(
            abi.encodeWithSelector(IVM.execute.selector, commands, state)
        );
        require(success, string(data));

        return abi.decode(data, (bytes[]));
    }
}
