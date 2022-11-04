// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../access/ACL.sol";
import "../access/Roles.sol";
import "../interfaces/IERC4337.sol";

abstract contract ERC4337 is IERC4337, ACL, Roles {
    using StorageAPI for bytes32;
    using UserOperationLib for UserOperation;

    // Using same slot generation technique as eip-1967 -- https://eips.ethereum.org/EIPS/eip-1967
    bytes32 internal constant NONCE = bytes32(uint256(keccak256("enso.wallet.nonce")) - 1);

    error InvalidSignature();
    error InvalidNonce();

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 requestId,
        address aggregator,
        uint256 missingWalletFunds
    ) external override isPermitted(VALIDATOR_ROLE) {
        _validateSignature(userOp, requestId, aggregator);
        if (userOp.initCode.length == 0) {
            _validateAndUpdateNonce(userOp);
        }
        _payPrefund(missingWalletFunds);
    }

    function _validateAndUpdateNonce(UserOperation calldata userOp) internal {
        uint256 nonce = NONCE.getUint256();
        if (nonce != userOp.nonce) revert InvalidNonce();
        unchecked { nonce++; }
        NONCE.setUint256(nonce);
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 requestId,
        address
    ) internal view {
        bytes32 hash = ECDSA.toEthSignedMessageHash(requestId);
        // Currently we only expect the entryPoint to have the EXECUTOR_ROLE
        // permission. If the entryPoint has permission over other roles, the
        // following check would be insufficient to safely restrict access to
        // those roles, since a signer with the EXECUTOR_ROLE could call functions
        // they do not have access to via the entryPoint
        if (!_getPermission(EXECUTOR_ROLE, ECDSA.recover(hash, userOp.signature))) revert InvalidSignature();
    }

    function _payPrefund(uint256 missingWalletFunds) internal virtual {
        if (missingWalletFunds != 0) {
            (bool success,) = payable(msg.sender).call{value : missingWalletFunds, gas : type(uint256).max}("");
            (success);
            //ignore failure (its EntryPoint's job to verify, not wallet.)
        }
    }
}
