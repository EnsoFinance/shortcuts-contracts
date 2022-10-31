// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import {EnsoWalletFactory} from "../../contracts/EnsoWalletFactory.sol";
import {DumbEnsoWallet} from "../../contracts/test/DumbEnsoWallet.sol";
import {EnsoWallet} from "../../contracts/EnsoWallet.sol";

contract EnsoWalletUser is Test {
    EnsoWalletFactory internal factory;
    DumbEnsoWallet public wallet;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);
    event Deployed(EnsoWallet instance, string label);

    constructor(address _factory) {
        factory = EnsoWalletFactory(_factory);
    }

    function deployEnsoWallet(bytes32[] memory commands, bytes[] memory state) public payable {
        vm.expectEmit(true, true, true, true);
        emit Deployed(EnsoWallet(factory.getAddress()), "");
        factory.deploy(commands, state);
        wallet = DumbEnsoWallet(factory.getAddress());
        assertEq(wallet.getPermission(wallet.OWNER_ROLE(), address(this)), true);
    }

    function setPermission(bytes32 role, address account, bool permission) public {
        wallet.setPermission(role, account, permission);
    }
}
