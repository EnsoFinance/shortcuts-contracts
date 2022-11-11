// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import {EnsoWalletFactory} from "../../contracts/EnsoWalletFactory.sol";
import {EnsoBeacon} from "../../contracts/EnsoBeacon.sol";
import {EnsoWallet} from "../../contracts/EnsoWallet.sol";
import {MinimalWallet} from "../../contracts/wallet/MinimalWallet.sol";
import {DumbEnsoWallet} from "../../contracts/test/DumbEnsoWallet.sol";
import {DestructEnsoWallet} from "../../contracts/test/DestructEnsoWallet.sol";
import {UpgradeableProxy} from "../../contracts/proxy/UpgradeableProxy.sol";
import {EnsoWalletUser} from "./EnsoWalletUser.t.sol";
import {OwnershipTester} from "../../contracts/test/OwnershipTester.sol";
import {MockFactoryUpgrade} from "../../contracts/test/MockFactoryUpgrade.sol";
import {MockWalletUpgrade} from "../../contracts/test/MockWalletUpgrade.sol";
import {MockERC20, IERC20} from "../../contracts/test/MockERC20.sol";
import {MockERC721, IERC721} from "../../contracts/test/MockERC721.sol";
import {MockERC1155, IERC1155} from "../../contracts/test/MockERC1155.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract EnsoWalletFactoryTest is Test, ERC721Holder, ERC1155Holder {
    MinimalWallet internal basicWalletReference;
    DumbEnsoWallet internal ensoWalletReference;
    DumbEnsoWallet internal ensoWallet;
    EnsoWalletFactory internal factoryReference;
    EnsoWalletFactory internal factory;
    EnsoWalletFactory internal destructFactory;
    EnsoWalletFactory internal destructFactory2;
    EnsoBeacon internal beacon;
    EnsoBeacon internal destructBeacon;
    EnsoWalletUser internal user;
    EnsoWalletUser internal user2;
    DestructEnsoWallet internal destructEnsoWalletReference;
    DestructEnsoWallet internal destroyedEnsoWallet;
    DestructEnsoWallet internal destructEnsoWallet;
    MockFactoryUpgrade internal mockFactoryReference;
    MockWalletUpgrade internal mockWalletReference;
    MockERC20 internal mockERC20;
    MockERC721 internal mockERC721;
    MockERC1155 internal mockERC1155;

    bytes32 immutable EOACodeHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

    bytes32[] internal commands;
    bytes[] internal state;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    event VMData(bytes32[] commands, bytes[] state);
    event SenderData(address sender, uint256 value);

    function setUp() public {
        basicWalletReference = new MinimalWallet();
        ensoWalletReference = new DumbEnsoWallet();
        destructEnsoWalletReference = new DestructEnsoWallet();
        beacon = new EnsoBeacon(address(ensoWalletReference), address(0));
        destructBeacon = new EnsoBeacon(address(destructEnsoWalletReference), address(0));
        factoryReference = new EnsoWalletFactory(address(beacon));
        mockFactoryReference = new MockFactoryUpgrade(address(beacon));
        mockWalletReference = new MockWalletUpgrade();
        factory = EnsoWalletFactory(address(new UpgradeableProxy(address(factoryReference))));
        factory.initialize();
        destructFactory = new EnsoWalletFactory(address(destructBeacon));
        destructFactory2 = new EnsoWalletFactory(address(destructBeacon));
        for (uint256 i = 0; i < 50; i++) {
            commands.push(keccak256("hello world"));
            state.push(bytes("hello world"));
        }
        factory.deploy(emptyCommands, emptyState);
        ensoWallet = DumbEnsoWallet(factory.getAddress());
        user = new EnsoWalletUser(address(factory));
        user2 = new EnsoWalletUser(address(factory));
        destructFactory.deploy(emptyCommands, emptyState);
        destroyedEnsoWallet = DestructEnsoWallet(destructFactory.getAddress());
        // destruct EnsoWallet
        destroyedEnsoWallet.executeShortcut(emptyCommands, emptyState);
        // deploy tokens
        mockERC20 = new MockERC20("Test", "TEST");
        mockERC721 = new MockERC721("Test", "TEST");
        mockERC1155 = new MockERC1155("Test");
    }

    function testWithdrawETH() public {
        (bool success,) = address(ensoWallet).call{ value : 10**18 }("");
        require(success);
        assertEq(address(ensoWallet).balance, 10**18);
        ensoWallet.withdrawETH(10**18);
        assertEq(address(ensoWallet).balance, 0);
    }

    function testFailWithdrawETH() public {
        ensoWallet.withdrawETH(10**18);
    }

    function testWithdrawERC20() public {
        mockERC20.transfer(address(ensoWallet), 10**18);
        assertEq(mockERC20.balanceOf(address(ensoWallet)), 10**18);
        IERC20[] memory erc20s = new IERC20[](1);
        uint256[] memory amounts = new uint256[](1);
        erc20s[0] = mockERC20;
        amounts[0] = 10**18;
        ensoWallet.withdrawERC20s(erc20s, amounts);
        assertEq(mockERC20.balanceOf(address(ensoWallet)), 0);
    }

    function testFailWithdrawERC20() public {
        IERC20[] memory erc20s = new IERC20[](1);
        uint256[] memory amounts = new uint256[](1);
        erc20s[0] = mockERC20;
        amounts[0] = 10**18;
        ensoWallet.withdrawERC20s(erc20s, amounts);
    }

    function testWithdrawERC721() public {
        mockERC721.safeTransferFrom(address(this), address(ensoWallet), 0);
        assertEq(mockERC721.balanceOf(address(ensoWallet)), 1);
        uint256[] memory ids = new uint256[](1);
        ids[0] = 0;
        ensoWallet.withdrawERC721s(mockERC721, ids);
        assertEq(mockERC721.balanceOf(address(ensoWallet)), 0);
    }

    function testFailWithdrawERC721() public {
        uint256[] memory ids = new uint256[](1);
        ids[0] = 0;
        ensoWallet.withdrawERC721s(mockERC721, ids);
    }

    function testWithdrawERC1155() public {
        mockERC1155.safeTransferFrom(address(this), address(ensoWallet), 0, 1, "");
        assertEq(mockERC1155.balanceOf(address(ensoWallet), 0), 1);
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = 0;
        amounts[0] = 1;
        ensoWallet.withdrawERC1155s(mockERC1155, ids, amounts);
        assertEq(mockERC1155.balanceOf(address(ensoWallet), 0), 0);
    }

    function testFailWithdrawERC1155() public {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = 0;
        amounts[0] = 1;
        ensoWallet.withdrawERC1155s(mockERC1155, ids, amounts);
    }

    function testWithdrawAll() public {
        // Deposit all
        (bool success,) = address(ensoWallet).call{ value : 10**18 }("");
        require(success);
        mockERC20.transfer(address(ensoWallet), 10**18);
        mockERC721.safeTransferFrom(address(this), address(ensoWallet), 0);
        mockERC721.safeTransferFrom(address(this), address(ensoWallet), 1);
        mockERC1155.safeTransferFrom(address(this), address(ensoWallet), 0, 1, "");

        // Confirm deposit
        assertEq(address(ensoWallet).balance, 10**18);
        assertEq(mockERC20.balanceOf(address(ensoWallet)), 10**18);
        assertEq(mockERC721.balanceOf(address(ensoWallet)), 2);
        assertEq(mockERC1155.balanceOf(address(ensoWallet), 0), 1);

        // Setup withdrawal notes
        MinimalWallet.TransferNote[] memory notes = new MinimalWallet.TransferNote[](4);

        notes[0].protocol = MinimalWallet.Protocol.ETH;
        notes[0].amounts = new uint256[](1);
        notes[0].amounts[0] = 10**18;

        notes[1].protocol = MinimalWallet.Protocol.ERC20;
        notes[1].token = address(mockERC20);
        notes[1].amounts = new uint256[](1);
        notes[1].amounts[0] = 10**18;

        notes[2].protocol = MinimalWallet.Protocol.ERC721;
        notes[2].token = address(mockERC721);
        notes[2].ids = new uint256[](2); // Withdrawing two NFTs from same ERC721
        notes[2].ids[0] = 0;
        notes[2].ids[1] = 1;

        notes[3].protocol = MinimalWallet.Protocol.ERC1155;
        notes[3].token = address(mockERC1155);
        notes[3].ids = new uint256[](1);
        notes[3].ids[0] = 0;
        notes[3].amounts = new uint256[](1);
        notes[3].amounts[0] = 1;

        // Withdraw all
        ensoWallet.withdraw(notes);

        // Confirm withdraw
        assertEq(address(ensoWallet).balance, 0);
        assertEq(mockERC20.balanceOf(address(ensoWallet)), 0);
        assertEq(mockERC721.balanceOf(address(ensoWallet)), 0);
        assertEq(mockERC1155.balanceOf(address(ensoWallet), 0), 0);
    }

    function testRevokeERC20() public {
        address operator = address(factory); // random address
        ensoWallet.approveERC20(mockERC20, operator);
        assertGt(mockERC20.allowance(address(ensoWallet), operator), 0);

        address[] memory operators = new address[](1);
        operators[0] = operator;
        ensoWallet.revokeERC20Approvals(mockERC20, operators);
        assertEq(mockERC20.allowance(address(ensoWallet), operator), 0);
    }

    function testRevokeERC721() public {
        address operator = address(factory); // random address
        ensoWallet.approveERC721(mockERC721, operator);
        assertTrue(mockERC721.isApprovedForAll(address(ensoWallet), operator));

        address[] memory operators = new address[](1);
        operators[0] = operator;
        ensoWallet.revokeERC721Approvals(mockERC721, operators);
        assertFalse(mockERC721.isApprovedForAll(address(ensoWallet), operator));
    }

    function testRevokeERC1155() public {
        address operator = address(factory); // random address
        ensoWallet.approveERC1155(mockERC1155, operator);
        assertTrue(mockERC1155.isApprovedForAll(address(ensoWallet), operator));

        address[] memory operators = new address[](1);
        operators[0] = operator;
        ensoWallet.revokeERC1155Approvals(mockERC1155, operators);
        assertFalse(mockERC1155.isApprovedForAll(address(ensoWallet), operator));
    }

    function testRevokeAll() public {
        address operator = address(factory); // random address

        // Approve all
        ensoWallet.approveERC20(mockERC20, operator);
        ensoWallet.approveERC721(mockERC721, operator);
        ensoWallet.approveERC1155(mockERC1155, operator);

        // Confirm approval
        assertGt(mockERC20.allowance(address(ensoWallet), operator), 0);
        assertTrue(mockERC721.isApprovedForAll(address(ensoWallet), operator));
        assertTrue(mockERC1155.isApprovedForAll(address(ensoWallet), operator));

        // Setup approval notes
        MinimalWallet.ApprovalNote[] memory notes = new MinimalWallet.ApprovalNote[](4);

        address[] memory operators = new address[](1);
        operators[0] = operator;

        notes[1].protocol = MinimalWallet.Protocol.ERC20;
        notes[1].token = address(mockERC20);
        notes[1].operators = operators;

        notes[2].protocol = MinimalWallet.Protocol.ERC721;
        notes[2].token = address(mockERC721);
        notes[2].operators = operators;

        notes[3].protocol = MinimalWallet.Protocol.ERC1155;
        notes[3].token = address(mockERC1155);
        notes[3].operators = operators;

        // Revoke all
        ensoWallet.revokeApprovals(notes);

        // Confirm revocation
        assertEq(mockERC20.allowance(address(ensoWallet), operator), 0);
        assertFalse(mockERC721.isApprovedForAll(address(ensoWallet), operator));
        assertFalse(mockERC1155.isApprovedForAll(address(ensoWallet), operator));
    }

    function testUpgradeWallet() public {
        beacon.upgradeCore(address(mockWalletReference), address(0), "");
        beacon.finalizeUpgrade();
        assertTrue(MockWalletUpgrade(payable(ensoWallet)).newFunctionTest());
    }

    function testFailToExecuteAfterEmergencyUpgrade() public {
        beacon.upgradeFallback(address(basicWalletReference));
        beacon.emergencyUpgrade();
        ensoWallet.executeShortcut(commands, state);
    }

    function testWithdrawAfterEmergencyUpgrade() public {
        // Deposit ETH
        (bool success,) = address(ensoWallet).call{ value : 10**18 }("");
        require(success);
        assertEq(address(ensoWallet).balance, 10**18);
        // Emergency
        beacon.upgradeFallback(address(basicWalletReference));
        beacon.emergencyUpgrade();
        // Withdraw ETH
        ensoWallet.withdrawETH(10**18);
        assertEq(address(ensoWallet).balance, 0);
    }

    function testUpgradeFactory() public {
        factory.upgradeTo(address(mockFactoryReference));
        assertTrue(MockFactoryUpgrade(address(factory)).newFunctionTest());
    }

    function testFailUpgradeFactoryNotOwner() public {
        OwnershipTester ownershipTester = new OwnershipTester();
        factory.transferOwnership(address(ownershipTester));
        ownershipTester.acceptOwnership(address(factory));
        factory.upgradeTo(address(mockFactoryReference));
    }

    function testFailUpgradeFactoryNotUUPS() public {
        factory.upgradeTo(address(ensoWallet));
    }

    function testUpgradeWalletAndFactory() public {
        factory.transferOwnership(address(beacon));
        beacon.acceptOwnership(address(factory));
        beacon.setFactory(address(factory));
        beacon.upgradeCore(address(mockWalletReference), address(mockFactoryReference), "");
        beacon.finalizeUpgrade();
        assertTrue(MockWalletUpgrade(payable(ensoWallet)).newFunctionTest());
        assertTrue(MockFactoryUpgrade(address(factory)).newFunctionTest());
    }

    function testTransferFactoryOwnership() public {
        factory.transferOwnership(address(beacon));
        assertEq(factory.owner(), address(this));
        beacon.acceptOwnership(address(factory));
        assertEq(factory.owner(), address(beacon));
        beacon.transferOwnership(address(factory), address(this));
        assertEq(factory.owner(), address(beacon));
        factory.acceptOwnership();
        assertEq(factory.owner(), address(this));
    }

    function testTransferAdministration() public {
        OwnershipTester ownershipTester = new OwnershipTester();
        beacon.transferAdministration(address(ownershipTester));
        ownershipTester.acceptAdministration(address(beacon));
        assertEq(beacon.admin(), address(ownershipTester));
    }

    function testTransferDelegation() public {
        OwnershipTester ownershipTester = new OwnershipTester();
        beacon.transferDelegation(address(ownershipTester));
        ownershipTester.acceptDelegation(address(beacon));
        assertEq(beacon.delegate(), address(ownershipTester));
    }

    function testRenounceAdministration() public {
        beacon.renounceAdministration();
        assertEq(beacon.admin(), address(0));
        assertEq(beacon.delegate(), address(0));
    }

    function testRenounceDelegation() public {
        beacon.renounceDelegation();
        assertEq(beacon.delegate(), address(0));
    }

    function testChangeDelay() public {
        uint256 newDelay = 100;
        beacon.setDelay(newDelay);
        assertEq(beacon.delay(), newDelay);
    }

    function testFuzzDeploy(bytes32[] memory c, bytes[] memory s) public {
        user.deployEnsoWallet(c, s);
    }

    function testFuzzDeployCustom(string memory l, bytes32[] memory c, bytes[] memory s) public {
        vm.assume(bytes(l).length > 0);
        user.deployCustomEnsoWallet(l, c, s);
    }

    function testFuzzExecute(bytes32[] memory c, bytes[] memory s) public {
        vm.expectEmit(true, true, true, true);
        emit VMData(c, s);
        ensoWallet.executeShortcut(c, s);
    }

    function testDestroyRedeploy() public {
        // code is wiped
        assertTrue(address(destroyedEnsoWallet).code.length == 0);
        destructFactory.deploy(emptyCommands, emptyState);
        assertEq(destroyedEnsoWallet.getPermission(destroyedEnsoWallet.OWNER_ROLE(), address(this)), true);
        assertFalse(address(destroyedEnsoWallet).code.length == 0);
    }

    // Attempt to self-destruct the EnsoWallet using call
    function testTryToDestroyEnsoWallet() public {
        destructFactory2.deploy(emptyCommands, emptyState);
        destructEnsoWallet = DestructEnsoWallet(destructFactory2.getAddress());

        assertEq(destructEnsoWallet.getPermission(destructEnsoWallet.OWNER_ROLE(), address(this)), true);
        // destruct EnsoWallet
        destructEnsoWallet.executeShortcut(emptyCommands, emptyState);

        // state is not wiped
        assertEq(destructEnsoWallet.getPermission(destructEnsoWallet.OWNER_ROLE(), address(this)), true);

        destructEnsoWallet.executeShortcut(emptyCommands, emptyState);
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
        destructFactory.deploy(emptyCommands, emptyState);
        destroyedEnsoWallet = DestructEnsoWallet(destructFactory.getAddress());
    }

    function testExecuteNoState() public {
        ensoWallet.executeShortcut(emptyCommands, emptyState);
    }

    function testExecuteLargeState() public {
        ensoWallet.executeShortcut(commands, state);
    }

    function testDeployNoState() public {
        user2.deployEnsoWallet(emptyCommands, emptyState);
    }

    function testDeployLargeState() public {
        user2.deployEnsoWallet(commands, state);
    }

    function testFailToRemoveOwnership() public {
        user.deployEnsoWallet(emptyCommands, emptyState);
        user.setPermission(user.wallet().OWNER_ROLE(), address(user), false);
    }

    function testFailExecuteNoPermission() public {
        user.deployEnsoWallet(emptyCommands, emptyState);
        user.wallet().executeShortcut(commands, state);
    }

    function testExecuteMultiOwner() public {
        user.deployEnsoWallet(emptyCommands, emptyState);
        user.setPermission(user.wallet().EXECUTOR_ROLE(), address(this), true);
        user.wallet().executeShortcut(commands, state);
    }

    receive() external payable {}
}
