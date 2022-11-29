// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../access/AccessController.sol";
import "./ApprovableMinimalWallet.sol";

contract DumbEnsoWallet is AccessController, ApprovableMinimalWallet {
    using StorageAPI for bytes32;

    // Using same slot generation technique as eip-1967 -- https://eips.ethereum.org/EIPS/eip-1967
    bytes32 internal constant SALT = bytes32(uint256(keccak256("enso.wallet.salt")) - 1);

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);

    error AlreadyInit();

    function initialize(
        address owner,
        bytes32 salt,
        bytes32 shortcutId,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external payable {
        (shortcutId);
        if (SALT.getBytes32() != bytes32(0)) revert AlreadyInit();
        SALT.setBytes32(salt);
        _setPermission(OWNER_ROLE, owner, true);
        _setPermission(EXECUTOR_ROLE, owner, true);
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function executeShortcut(bytes32 shortcutId, bytes32[] calldata commands, bytes[] calldata state) public payable isPermitted(EXECUTOR_ROLE) returns (bytes[] memory) {
        (shortcutId);
        return _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] memory state) internal returns (bytes[] memory) {
        emit VMData(commands, state);
        emit SenderData(msg.sender, msg.value);
        return state;
    }
}
