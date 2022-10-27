// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./DumbEnsoWallet.sol";

contract MockWalletUpgrade is DumbEnsoWallet {
    function newFunctionTest() external pure returns (bool) {
        return true;
    }
}