// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../access/AccessController.sol";
import "../wallet/MinimalWallet.sol";

contract Destroyer {
    function kill() public returns (bytes[] memory data) {
        selfdestruct(payable(msg.sender));
        return data;
    }
}

contract DestructEnsoWallet is AccessController, MinimalWallet {

    address public owner;

    error NotOwner();

    event DelegateCallReturn(bool success, bytes ret);

    error AlreadyInit();
    error NotCaller();

    function initialize(
        address caller,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        if (owner != address(0)) revert AlreadyInit();
        owner = caller;
        _setPermission(OWNER_ROLE, caller, true);
        if (commands.length != 0) {
            execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state) public returns (bytes[] memory data) {
        if (msg.sender != owner) revert NotOwner();
        Destroyer destroyer = new Destroyer();
        (bool success, bytes memory ret) = address(destroyer).delegatecall(
            abi.encodeWithSelector(destroyer.kill.selector, commands, state)
        );
        emit DelegateCallReturn(success, ret);
        return data;
    }
}
