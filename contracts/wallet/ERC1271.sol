// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IERC1271.sol";

abstract contract ERC1271 is IERC1271 {
    using ECDSA for bytes32;

    bytes4 constant internal MAGICVALUE_BYTES = 0x20c13b0b;
    bytes4 constant internal MAGICVALUE_BYTES32 = 0x1626ba7e;
    bytes4 constant internal INVALID_SIGNATURE = 0xffffffff;

    function isValidSignature(
        bytes32 _hash,
        bytes memory _signature
    )
        public
        override
        view
        returns (bytes4 magicValue)
    {
        address signer = _hash.recover(_signature);
        magicValue = _checkSigner(signer) ? MAGICVALUE_BYTES32 : INVALID_SIGNATURE;
    }

    function isValidSignature(
        bytes memory _message,
        bytes memory _signature
    )
        public
        override
        view
        returns (bytes4 magicValue)
    {
        address signer = _getEthSignedMessageHash(_message).recover(_signature);
        magicValue = _checkSigner(signer) ? MAGICVALUE_BYTES : INVALID_SIGNATURE;
    }

    // @dev Adds ETH signed message prefix to bytes message and hashes it
    // @param _data Bytes data before adding the prefix
    // @return Prefixed and hashed message
    function _getEthSignedMessageHash(bytes memory _data) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(_data.length), _data));
    }

    // @notice Confirm signer is permitted to sign on behalf of contract
    // @dev Abstract function to implemented by importing contract
    // @param signer The address of the message signer
    // @return Bool confirming whether signer is permitted
    function _checkSigner(address signer) internal view virtual returns (bool);
}
