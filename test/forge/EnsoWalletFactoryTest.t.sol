// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import {EnsoWalletFactory} from "../../contracts/EnsoWalletFactory.sol";
import {DumbEnsoWallet} from "../../contracts/test/DumbEnsoWallet.sol";
import {EnsoWallet} from "../../contracts/EnsoWallet.sol";
import {DestructEnsoWallet} from "../../contracts/test/DestructEnsoWallet.sol";
import {EnsoWalletUser} from "./EnsoWalletUser.t.sol";

contract EnsoWalletFactoryTest is Test {
    DumbEnsoWallet internal ensoWalletReference;
    DumbEnsoWallet internal ensoWallet;
    EnsoWalletFactory internal factory;
    EnsoWalletFactory internal destructFactory;
    EnsoWalletFactory internal destructFactory2;
    EnsoWalletUser internal user;
    EnsoWalletUser internal user2;
    DestructEnsoWallet internal destructEnsoWalletReference;
    DestructEnsoWallet internal destroyedEnsoWallet;
    DestructEnsoWallet internal destructEnsoWallet;

    bytes32 immutable EOACodeHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);

    function setUp() public {
        ensoWalletReference = new DumbEnsoWallet();
        destructEnsoWalletReference = new DestructEnsoWallet();
        factory = new EnsoWalletFactory(address(ensoWalletReference));
        destructFactory = new EnsoWalletFactory(address(destructEnsoWalletReference));
        destructFactory2 = new EnsoWalletFactory(address(destructEnsoWalletReference));
        for (uint256 i = 0; i < 50; i++) {
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(emptyCommands, emptyState);
        ensoWallet = DumbEnsoWallet(factory.getAddress());
        user = new EnsoWalletUser(address(factory));
        user2 = new EnsoWalletUser(address(factory));
        destroyedEnsoWallet = DestructEnsoWallet(address(destructFactory.deploy(emptyCommands, emptyState)));
        // destruct EnsoWallet
        destroyedEnsoWallet.execute(emptyCommands, emptyState);
    }

    function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
        user.deployEnsoWallet(c, s);
    }

    function testFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(c, s);
        ensoWallet.execute(c, s);
    }

    function testDestroyRedeploy() public {
        // code is wiped
        assertTrue(address(destroyedEnsoWallet).code.length == 0);
        destructFactory.deploy(emptyCommands, emptyState);
        assertEq(destroyedEnsoWallet.caller(), address(this));
        assertTrue(destroyedEnsoWallet.init());
        assertFalse(address(destroyedEnsoWallet).code.length == 0);
    }

    // Attempt to self-destruct the EnsoWallet using call
    function testTryToDestroyEnsoWallet() public {
        destructEnsoWallet = DestructEnsoWallet(address(destructFactory2.deploy(emptyCommands, emptyState)));

        assertEq(destructEnsoWallet.caller(), address(this));
        // destruct EnsoWallet
        destructEnsoWallet.execute(emptyCommands, emptyState);

        // state is not wiped
        assertEq(destructEnsoWallet.caller(), address(this));
        assertTrue(destructEnsoWallet.init());

        destructEnsoWallet.execute(emptyCommands, emptyState);
        address destructEnsoWalletAddr = address(destructEnsoWallet);
        // NOTE: A caveat with selfdestruct is that it seems to maintain it's "codesize" until the end of the current transaction
        bytes32 codeHash;
        assembly {
            codeHash := extcodehash(destructEnsoWalletAddr)
        }
        assertTrue(codeHash != bytes32(0) && codeHash != EOACodeHash);
        assertTrue(address(destructEnsoWallet).code.length > 0);
        assertTrue(address(ensoWalletReference).code.length > 0);
    }

    // Verify that destructEnsoWallet now has no code
    function testDestructedCodesize() public {
        bytes32 codeHash;
        address destructEnsoWalletAddr = address(destroyedEnsoWallet);
        assembly {
            codeHash := extcodehash(destructEnsoWalletAddr)
        }
        assertTrue(codeHash == bytes32(0));
        assertTrue(address(destroyedEnsoWallet).code.length == 0);
        // reference still has it's code
        assertTrue(address(ensoWalletReference).code.length > 0);
        destroyedEnsoWallet = DestructEnsoWallet(address(destructFactory.deploy(emptyCommands, emptyState)));
    }

    function testExecuteNoState() public {
        ensoWallet.execute(emptyCommands, emptyState);
    }

    function testExecuteLargeState() public {
        ensoWallet.execute(commands, state);
    }

    function testDeployNoState() public {
        user2.deployEnsoWallet(emptyCommands, emptyState);
    }

    function testDeployLargeState() public {
        user2.deployEnsoWallet(commands, state);
    }
}
