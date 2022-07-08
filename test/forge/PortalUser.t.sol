// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PortalFactory} from "../../contracts/PortalFactory.sol";
import {DumbPortal} from "../../contracts/test/DumbPortal.sol";
import {Portal} from "../../contracts/Portal.sol";

contract PortalUser is Test {
    PortalFactory internal factory;
    DumbPortal internal portal;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);
    event Deployed(Portal instance);

    constructor(address _factory) {
        factory = PortalFactory(_factory);
    }

    function deployPortal(bytes32[] memory commands, bytes[] memory state) public payable {
        vm.expectEmit(true, true, true, true);
        emit Deployed(Portal(factory.getAddress()));
        factory.deploy(commands, state);
        portal = DumbPortal(factory.getAddress());
        assertEq(portal.caller(), address(this));
    }
}

