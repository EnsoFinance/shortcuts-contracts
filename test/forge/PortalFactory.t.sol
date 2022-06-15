// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PortalFactory} from "../../contracts/PortalFactory.sol";
import {Portal} from "../../contracts/Portal.sol";
import {MockVm} from "../../contracts/mocks/MockVm.sol";


contract PortalUser is Test{

    PortalFactory internal factory;
    Portal internal portal;

    event VmData(bytes32[] commands, bytes[] state);

    constructor(address _factory) {
        factory = PortalFactory(_factory);
    }

    function deployPortal(bytes32[] memory commands, bytes[] memory state) public {
        vm.expectEmit(true, true, true, true);
        emit VmData(commands, state);
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
    }
}

contract PortalFactoryTest is Test {
    Portal internal portalReference;
    Portal internal portal;
    PortalFactory internal factory;
    PortalUser internal user;
    PortalUser internal user2;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VmData(bytes32[] commands, bytes[] state);

    function setUp() public {
        MockVm mockVm = new MockVm();
        portalReference = new Portal();
        factory = new PortalFactory(address(mockVm), address(portalReference));
        for (uint i = 0; i < 500; i++){
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
        user = new PortalUser(address(factory));
        user2 = new PortalUser(address(factory));
    }

    function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
        user.deployPortal(c, s);
    }

    function testFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VmData(c, s);
        portal.execute(c, s);
    }

    function testExecuteNoState() public {
        portal.execute(emptyCommands, emptyState);
    }

    function testDeployNoState() public {
        user2.deployPortal(emptyCommands, emptyState);
    }
}
