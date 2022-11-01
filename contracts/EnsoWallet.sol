// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@ensofinance/weiroll/contracts/VM.sol";
import "./access/AccessController.sol";
import "./wallet/ERC1271.sol";
import "./wallet/MinimalWallet.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWallet is IEnsoWallet, VM, AccessController, ERC1271, MinimalWallet {
    using StorageAPI for bytes32;

    // Using same slot generation technique as eip-1967 -- https://eips.ethereum.org/EIPS/eip-1967
    bytes32 internal constant SALT = bytes32(uint256(keccak256("enso.wallet.salt")) - 1);

    error AlreadyInit();

    function initialize(
        address owner,
        bytes32 salt,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external override payable {
        if (SALT.getBytes32() != bytes32(0)) revert AlreadyInit();
        SALT.setBytes32(salt);
        _setPermission(OWNER_ROLE, owner, true);
        _setPermission(EXECUTOR_ROLE, owner, true);
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function execute(
        address target,
        uint256 value,
        bytes memory data
    ) external payable isPermitted(EXECUTOR_ROLE) returns (bool success) {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function executeShortcut(bytes32[] calldata commands, bytes[] calldata state)
        external
        payable
        isPermitted(EXECUTOR_ROLE)
        returns (bytes[] memory returnData)
    {
        returnData = _execute(commands, state);
    }

    function _checkSigner(address signer) internal view override returns (bool) {
        return _getPermission(OWNER_ROLE, signer);
    }
}
