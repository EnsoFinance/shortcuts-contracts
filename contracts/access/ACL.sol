//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "../libraries/StorageAPI.sol";

abstract contract ACL {
    using StorageAPI for bytes32;

    error NotPermitted();

    modifier isPermitted(bytes32 role) {
        bool permitted = _getPermission(role, msg.sender); // TODO: support GSN/Account abstraction
        if (!permitted) revert NotPermitted();
        _;
    }

    function getPermission(
        bytes32 role,
        address user
    ) external view returns (bool) {
        return _getPermission(role, user);
    }

    function _getPermission(
        bytes32 role,
        address user
    ) internal view returns (bool) {
        bytes32 key = _getKey(role, user);
        return key.getBool();
    }

    function _getKey(
        bytes32 role,
        address user
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(role, user));
    }
}
