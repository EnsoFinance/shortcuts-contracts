// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.16;

import "./DumbEnsoWallet.sol";

contract MockWalletUpgrade is DumbEnsoWallet {
    function newFunctionTest() external pure returns (bool) {
        return true;
    }
}
