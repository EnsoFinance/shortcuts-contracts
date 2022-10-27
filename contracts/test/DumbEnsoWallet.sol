// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../access/AccessController.sol";
import "../wallet/MinimalWallet.sol";

contract DumbEnsoWallet is AccessController, MinimalWallet {
    using StorageAPI for bytes32;

    address public owner;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);

    error AlreadyInit();

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

    function execute(bytes32[] calldata commands, bytes[] calldata state) public payable returns (bytes[] memory) {
        return _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] memory state) internal returns (bytes[] memory) {
        emit VMData(commands, state);
        emit SenderData(msg.sender, msg.value);
        // TODO: foundry bug?
        //      comparing to address(this) / msg.sender doesn't return the address alone
        //           ie.
        //           val: EnsoWalletFactoryTest: [0xb4c79dab8f259c7aee6e5b2aa729821864227e84])
        //           val: 0xb42486fb2979f5f97072f2f4af6673782f846963)
        // if (msg.sender != caller) revert NotCaller();
        return state;
    }
}
