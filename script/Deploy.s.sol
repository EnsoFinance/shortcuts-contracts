// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {PortalFactory} from "../contracts/PortalFactory.sol";
import {Portal} from "../contracts/Portal.sol";
import {DumbPortal} from "../contracts/test/DumbPortal.sol";

contract Deploy is Script {
    bytes32[] commands;
    bytes[] state;

    function setUp() public {
        commands.push(keccak256("hello world"));
        state.push(bytes("hello world"));
    }

    function run() public {
        vm.broadcast();
        Portal portalReference = new Portal();
        PortalFactory factory = new PortalFactory(address(portalReference));
        factory.deploy(commands, state);
        Portal portal = Portal(factory.getAddress());
    }
}
