// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../wallet/BasicWallet.sol";

contract Destroyer {
    function kill() public returns (bytes[] memory data) {
        selfdestruct(payable(msg.sender));
        return data;
    }
}

contract DestructEnsoWallet is BasicWallet {
    using StorageAPI for bytes32;

    event DelegateCallReturn(bool success, bytes ret);

    error AlreadyInit();
    error NotCaller();

    function initialize(
        address caller,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        if (OWNER.getAddress() != address(0)) revert AlreadyInit();
        OWNER.setAddress(caller);
        if (commands.length != 0) {
            execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state) public onlyOwner returns (bytes[] memory data) {
        Destroyer destroyer = new Destroyer();
        (bool success, bytes memory ret) = address(destroyer).delegatecall(
            abi.encodeWithSelector(destroyer.kill.selector, commands, state)
        );
        emit DelegateCallReturn(success, ret);
        return data;
    }
}
