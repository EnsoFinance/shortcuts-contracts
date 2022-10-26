// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@ensofinance/weiroll/contracts/VM.sol";
import "./wallet/ERC1271.sol";
import "./wallet/MinimalWallet.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWallet is IEnsoWallet, VM, ERC1271, MinimalWallet {
    using StorageAPI for bytes32;

    // Already initialized
    error AlreadyInit();

    function initialize(
        address caller,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) external override payable {
        if (OWNER.getAddress() != address(0)) revert AlreadyInit();
        OWNER.setAddress(caller);
        if (commands.length != 0) {
            _execute(commands, state);
        }
    }

    function execute(bytes32[] calldata commands, bytes[] calldata state)
        external
        payable
        onlyOwner
        returns (bytes[] memory returnData)
    {
        returnData = _execute(commands, state);
    }

    function _checkSigner(address signer) internal view override returns (bool) {
        return signer == OWNER.getAddress();
    }
}
