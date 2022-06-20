// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

library PortalErrors {
    // Already initialized
    error AlreadyInit();
    // Not caller
    error NotCaller();
}

interface IVM {
    function execute(bytes32[] calldata commands, bytes[] memory state) external payable returns (bytes[] memory);
}

contract Portal {
    bool public init;
    address public caller;
    address public VM;

    function initialize(
        address _VM,
        address _caller,
        bytes32[] calldata commands,
        bytes[] memory state
    ) external payable {
        if (init) revert PortalErrors.AlreadyInit();
        VM = _VM;
        init = true;
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
        require(success);

        return abi.decode(data, (bytes[]));
    }
}
