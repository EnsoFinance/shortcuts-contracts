// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PortalFactory} from "../../contracts/PortalFactory.sol";
import {Portal} from "../../contracts/Portal.sol";
import {MockVM} from "../../contracts/mocks/MockVM.sol";


contract PortalUser is Test{

    PortalFactory internal factory;
    Portal internal portal;

    event VMData(bytes32[] commands, bytes[] state);

    constructor(address _factory) {
        factory = PortalFactory(_factory);
    }

    function deployPortal(bytes32[] memory commands, bytes[] memory state) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(commands, state);
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
    }
}

contract HuffPortalFactoryTest is Test {
    Portal internal portalReference;
    Portal internal portal;
    PortalFactory internal factory;
    PortalUser internal user;
    PortalUser internal user2;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VMData(bytes32[] commands, bytes[] state);

    function setUp() public {
        MockVM mockVM = new MockVM();
        address huffPortal;
        bytes
            memory huffCode = hex"61005e8061000d6000396000f360003560e01c8063de792d5f1461001b57631f7c1bac14610051575b600054331461002a5760006000fd5b6000368082833781829183346001545af13d8083843e919060011461004f5760006000fd5bf35b602435600055600435600155";
        bytes32 salt = keccak256(abi.encode(1));
        assembly {
            huffPortal := create2(0, add(huffCode, 32), mload(huffCode), salt)
        }
        for (uint i = 0; i < 50; i++){
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory = new PortalFactory(address(mockVM), address(huffPortal));
        factory.deploy(commands, state);
        portal = Portal(factory.getAddress());
        user = new PortalUser(address(factory));
        user2 = new PortalUser(address(factory));
    }

    // function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
    //     user.deployPortal(c, s);
    // }

    function testHuffFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(c, s);
        portal.execute(c, s);
    }

    function testHuffExecuteNoState() public {
        portal.execute(emptyCommands, emptyState);
    }

    function testHuffExecuteLargeState() public {
        portal.execute(commands, state);
    }

    // function testHuffDeploy() public {
    //     user2.deployPortal(emptyCommands, emptyState);
    // }
}
