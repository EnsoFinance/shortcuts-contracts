// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PortalFactory} from "../../contracts/PortalFactory.sol";
import {DumbPortal} from "../../contracts/test/DumbPortal.sol";
import {Portal} from "../../contracts/Portal.sol";
import {DestructPortal} from "../../contracts/test/DestructPortal.sol";
import {PortalUser} from "./PortalUser.t.sol";

contract PortalFactoryTest is Test {
    DumbPortal internal portalReference;
    DumbPortal internal portal;
    PortalFactory internal factory;
    PortalFactory internal destructFactory;
    PortalUser internal user;
    PortalUser internal user2;
    DestructPortal internal destructPortalReference;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);

    function setUp() public {
        portalReference = new DumbPortal();
        destructPortalReference = new DestructPortal();
        factory = new PortalFactory(address(portalReference));
        destructFactory = new PortalFactory(address(destructPortalReference));
        for (uint256 i = 0; i < 50; i++) {
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(emptyCommands, emptyState);
        portal = DumbPortal(factory.getAddress());
        user = new PortalUser(address(factory));
        user2 = new PortalUser(address(factory));
    }

    function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
        user.deployPortal(c, s);
    }

    function testFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(c, s);
        portal.execute(c, s);
    }

    // Attempt to self-destruct the Portal using call
    function testDestroyPortal() public {
       DestructPortal p = DestructPortal(address(destructFactory.deploy(emptyCommands, emptyState)));
       // destruct portal
        p.execute(commands, state);
        // state is wiped
        assertEq(p.caller(), address(0));
        assertFalse(p.init());
        vm.expectRevert(Portal.NotCaller.selector);
        p.execute(commands, state);
    }


    function testExecuteNoState() public {
        portal.execute(emptyCommands, emptyState);
    }

    function testExecuteLargeState() public {
        portal.execute(commands, state);
    }

    function testDeployNoState() public {
        user2.deployPortal(emptyCommands, emptyState);
    }

    function testDeployLargeState() public {
        user2.deployPortal(commands, state);
    }
}
