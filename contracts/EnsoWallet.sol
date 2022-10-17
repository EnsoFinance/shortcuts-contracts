// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@ensofinance/weiroll/contracts/VM.sol";
import "./libraries/StorageAPI.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWallet is IEnsoWallet, VM {
    using StorageAPI for bytes32;

    // Using same slot generation technique as eip-1967 -- https://eips.ethereum.org/EIPS/eip-1967
    bytes32 private constant OWNER = bytes32(uint256(keccak256("enso.wallet.owner")) - 1);

    // Already initialized
    error AlreadyInit();
    // Not owner
    error NotOwner();
    // Invalid address
    error InvalidAddress();

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
        returns (bytes[] memory returnData)
    {
        if (msg.sender != OWNER.getAddress()) revert NotOwner();
        returnData = _execute(commands, state);
    }

    receive() external payable {}
}
