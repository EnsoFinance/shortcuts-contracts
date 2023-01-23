// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.16;

import "../EnsoWalletFactory.sol";

contract MockFactoryUpgrade is EnsoWalletFactory {
    constructor(address ensoBeacon_) EnsoWalletFactory(ensoBeacon_) {}

    function newFunctionTest() external pure returns (bool) {
        return true;
    }
}
