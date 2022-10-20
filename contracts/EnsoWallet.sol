// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { VM } from "@ensofinance/weiroll/contracts/VM.sol";
import { ERC1271 } from "./wallet/ERC1271.sol";
import { BasicWallet, StorageAPI } from "./wallet/BasicWallet.sol";
import { IEnsoWallet } from "./interfaces/IEnsoWallet.sol";

contract EnsoWallet is IEnsoWallet, VM, ERC1271, BasicWallet {
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
