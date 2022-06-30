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
    PortalFactory internal destructFactory2;
    PortalUser internal user;
    PortalUser internal user2;
    DestructPortal internal destructPortalReference;
    DestructPortal internal destroyedPortal;
    DestructPortal internal destructPortal;

    bytes32 immutable EOACodeHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

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
        destructFactory2 = new PortalFactory(address(destructPortalReference));
        for (uint256 i = 0; i < 50; i++) {
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(emptyCommands, emptyState);
        portal = DumbPortal(factory.getAddress());
        user = new PortalUser(address(factory));
        user2 = new PortalUser(address(factory));
        destroyedPortal = DestructPortal(address(destructFactory.deploy(emptyCommands, emptyState)));
        // destruct portal
        destroyedPortal.execute(emptyCommands, emptyState);
    }

    function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
        user.deployPortal(c, s);
    }

    function testFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(c, s);
        portal.execute(c, s);
    }

    function testDestroyRedeploy() public {
        // code is wiped
        assertTrue(address(destroyedPortal).code.length == 0);
        destructFactory.deploy(emptyCommands, emptyState);
        assertEq(destroyedPortal.caller(), address(this));
        assertTrue(destroyedPortal.init());
        assertFalse(address(destroyedPortal).code.length == 0);
    }

    // Attempt to self-destruct the Portal using call
    function testDestroyPortal() public {
        destructPortal = DestructPortal(address(destructFactory2.deploy(emptyCommands, emptyState)));
        // destruct portal
        destructPortal.execute(emptyCommands, emptyState);
        // state is wiped
        assertEq(destructPortal.caller(), address(0));
        assertFalse(destructPortal.init());
        vm.expectRevert(Portal.NotCaller.selector);
        destructPortal.execute(emptyCommands, emptyState);
        address destructPortalAddr = address(destructPortal);
        // NOTE: A caveat with selfdestruct is that it seems to maintain it's "codesize" until the end of the current transaction
        bytes32 codeHash;
        assembly { codeHash := extcodehash(destructPortalAddr) }
        assertTrue(codeHash != bytes32(0) && codeHash != EOACodeHash);
        assertTrue(address(destructPortal).code.length > 0);
        assertTrue(address(portalReference).code.length > 0);
    }

    // Verify that destructPortal now has no code
    function testDestructedCodesize() public {
        bytes32 codeHash;
        address destructPortalAddr = address(destroyedPortal);
        assembly { codeHash := extcodehash(destructPortalAddr) }
        assertTrue(codeHash == bytes32(0));
        assertTrue(address(destroyedPortal).code.length == 0);
        // reference still has it's code
        assertTrue(address(portalReference).code.length > 0);
        destroyedPortal = DestructPortal(address(destructFactory.deploy(emptyCommands, emptyState)));
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
