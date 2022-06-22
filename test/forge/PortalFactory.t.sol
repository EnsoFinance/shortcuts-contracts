// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PortalFactory} from "../../contracts/PortalFactory.sol";
import {Portal} from "../../contracts/Portal.sol";
import {MockVM} from "../../contracts/mocks/MockVM.sol";
import {DestructVM} from "../../contracts/mocks/Destruct.sol";
import {DelegatePortal} from "../../contracts/test/DelegatePortal.sol";


contract PortalUser is Test{

    PortalFactory internal factory;
    Portal internal portal;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint value);
    event Deployed(Portal instance);

    constructor(address _factory) {
        factory = PortalFactory(_factory);
    }

    function deployPortal(bytes32[] memory commands, bytes[] memory state) public payable {
        vm.expectEmit(true, true, true, true);
        emit Deployed(Portal(factory.getAddress()));
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
    }
}

contract PortalFactoryTest is Test {
    Portal internal portalReference;
    Portal internal portal;
    PortalFactory internal factory;
    PortalFactory  internal delegateFactory;
    PortalUser internal user;
    PortalUser internal user2;
    DelegatePortal internal delegatePortal;
    DestructVM internal destructVM;
    MockVM internal mockVM;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint value);

    function setUp() public {
        mockVM = new MockVM();
        portalReference = new Portal();
        factory = new PortalFactory(address(mockVM), address(portalReference));
        for (uint i = 0; i < 50; i++){
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
        user = new PortalUser(address(factory));
        user2 = new PortalUser(address(factory));
        destructVM = new DestructVM(); 
        delegatePortal = new DelegatePortal();
        delegateFactory = new PortalFactory(address(mockVM), address(delegatePortal));
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
    function testDestroyPortalNoDelegate() public {
        portalReference = new Portal();
        factory = new PortalFactory(address(destructVM), address(portalReference));
        Portal p = Portal(factory.deploy(emptyCommands, emptyState));
        p.execute(emptyCommands, emptyState);
        assertEq(p.caller(), address(this));
        p.execute(emptyCommands, emptyState);
        assertEq(p.caller(), address(this));
    }

    // Attempt to self-destruct the Portal using delegatecall
    function testDestroyDelegatePortal() public {
        PortalFactory destructFactory = new PortalFactory(address(destructVM), address(delegatePortal));
        DelegatePortal p = DelegatePortal(address(destructFactory.deploy(emptyCommands, emptyState)));
        assertEq(p.caller(), address(this));
        // This call will destruct the users portal losing any ETH and state in the Portal
        p.execute(emptyCommands, emptyState);
        assertEq(p.caller(), address(0x0));
        // Trying to call now will fail as the state is wiped. Check that msg.sender == caller fails
        vm.expectRevert(Portal.NotCaller.selector);
        p.execute(emptyCommands, emptyState);
        // Attempting to deploy a new portal will fail due to AlreadyExists check (factory storage wasn't wiped)
        vm.expectRevert(PortalFactory.AlreadyExists.selector);
        destructFactory.deploy(emptyCommands, emptyState);
    }

    function testEOAIsSender() public {
        DelegatePortal dPortal = DelegatePortal(address((delegateFactory.deploy(emptyCommands, emptyState))));
        vm.expectEmit(true, true, false, false);
        emit SenderData(address(this), 0);
        dPortal.execute(emptyCommands, emptyState);
        /*
         TODO: comparing to address(this) doesn't return the address alone
              val: PortalFactoryTest: [0xb4c79dab8f259c7aee6e5b2aa729821864227e84])
              val: 0xb42486fb2979f5f97072f2f4af6673782f846963)


         assertEq(mockVM.lastSender(), address(this));
        */
    }

    function testPortalIsSender() public {
        vm.expectEmit(true, true, false, false);
        emit SenderData(address(portal), 0);
        portal.execute(emptyCommands, emptyState);
        assertEq(mockVM.lastSender(), address(portal));
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
}
