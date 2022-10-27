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

    // Already initialized
    error AlreadyInit();

    function initialize(
        address caller,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external override payable {
        if (SALT.getAddress() != address(0)) revert AlreadyInit();
        SALT.setAddress(caller);
        _setPermission(OWNER_ROLE, caller, true);
        _setPermission(EXECUTOR_ROLE, caller, true);
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state)
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
