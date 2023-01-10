// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import {EnsoWalletFactory} from "../../contracts/EnsoWalletFactory.sol";
import {EnsoBeacon} from "../../contracts/EnsoBeacon.sol";
import {EnsoWallet} from "../../contracts/EnsoWallet.sol";
import {UpgradeableProxy} from "../../contracts/proxy/UpgradeableProxy.sol";
import {StreamerModule} from "../../contracts/test/StreamerModule.sol";

contract StreamerModuleTest is Test{
    EnsoWallet internal ensoWalletReference;
    EnsoWallet internal ensoWallet;
    EnsoWalletFactory internal factoryReference;
    EnsoWalletFactory internal factory;
    EnsoBeacon internal beacon;
    StreamerModule internal streamer;

    bytes32[] internal emptyCommands;
    bytes[] internal emptyState;

    function setUp() public {
        ensoWalletReference = new EnsoWallet();
        beacon = new EnsoBeacon(address(this), address(ensoWalletReference), address(0));
        factoryReference = new EnsoWalletFactory(address(beacon));
        factory = EnsoWalletFactory(address(new UpgradeableProxy(address(factoryReference))));
        factory.initialize(address(this));
        factory.deploy(bytes32(0), emptyCommands, emptyState);
        ensoWallet = EnsoWallet(factory.getAddress());
        streamer = new StreamerModule();
    }

    function testStreamETH() public {
        (bool success, ) = address(ensoWallet).call{value: 10 ** 18}("");
        require(success);
        assertEq(address(ensoWallet).balance, 10 ** 18);
        uint256 balanceBefore = address(this).balance;
        // Give streamer module permission
        ensoWallet.setPermission(ensoWallet.MODULE_ROLE(), address(streamer), true);
        // Start stream
        bytes memory data = abi.encodeWithSelector(
            StreamerModule.addStream.selector,
            address(this),
            1,
            0,
            type(uint256).max
        );
        ensoWallet.execute(address(streamer), 0, data);
        // Skip time
        uint256 time = 3600;
        skip(time);
        streamer.stream(address(ensoWallet));
        uint256 balanceAfter = address(this).balance;
        assertEq(balanceAfter - balanceBefore, time);
    }

    receive() external payable {}
}
