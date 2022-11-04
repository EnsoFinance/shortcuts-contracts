// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../libraries/UserOperation.sol";

interface IERC4337 {
    function validateUserOp(UserOperation calldata userOp, bytes32 requestId, address aggregator, uint256 missingWalletFunds) external;
}
