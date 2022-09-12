// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

contract Destroyer {
    function kill() public returns (bytes[] memory data) {
        selfdestruct(payable(msg.sender));
        return data;
    }
}

contract DestructEnsoWallet {
    address public caller;
    bool public init;

    event DelegateCallReturn(bool success, bytes ret);

    error AlreadyInit();
    error NotCaller();

    function initialize(
        address caller_,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        if (init) revert AlreadyInit();
        caller = caller_;
        init = true;
        if (commands.length != 0) {
            execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state) public returns (bytes[] memory data) {
        if (msg.sender != caller) revert NotCaller();
        Destroyer destroyer = new Destroyer();
        (bool success, bytes memory ret) = address(destroyer).delegatecall(
            abi.encodeWithSelector(destroyer.kill.selector, commands, state)
        );
        emit DelegateCallReturn(success, ret);
        return data;
    }
}
