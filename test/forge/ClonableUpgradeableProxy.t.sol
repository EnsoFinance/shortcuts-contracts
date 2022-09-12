// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {ClonableTransparentUpgradeableProxy} from "../../helpers/ClonableTransparentUpgradeableProxy.sol";
import {IClonableTransparentUpgradeableProxy} from "../../interfaces/IClonableTransparentUpgradeableProxy.sol";
import {EnsoWallet} from "../../contracts/EnsoWallet.sol";
import {IEnsoWallet} from "../../contracts/EnsoWallet.sol";

import {EnsoShortcutsHelper} from "../../contracts/ShortcutsHelpers.sol";

interface IEnsoShortcutsHelper {
    function getBlockTimestamp() external view returns(uint256);
}

interface ITransparentUpgradeableProxy {
    function upgradeTo(address newImplementation) external;
}

contract ClonableUpgradeableProxyTest is Test {

    IClonableTransparentUpgradeableProxy private _clonableTUPTemplate;
    address private _admin;

    function setUp() public {
        _admin = address(69420); 
        // note: for TUP admin calls proxy functions but cannot call implementation functions, and vice-versa

        address firstImplementation = address(new EnsoShortcutsHelper());
        _clonableTUPTemplate = new ClonableTransparentUpgradeableProxy(firstImplementation, _admin); 
    }

    function testClone() public {
        bytes32 salt = keccak256(abi.encode("name of my first pet"));        
        address clone = Clones.cloneDeterministic(address(_clonableTUPTemplate), salt);

        address someOtherImplementation = address(new EnsoShortcutsHelper());
        IClonableTransparentUpgradeableProxy(clone).initialize(someOtherImplementation, _admin);
        assertEq(
            IEnsoShortcutsHelper(clone).getBlockTimestamp(), 
            IEnsoShortcutsHelper(someOtherImplementation).getBlockTimestamp());
    }

    function testCloneWithInitialization() public {
        bytes32 salt = keccak256(abi.encode("mother's maiden name"));        
        address clone = Clones.cloneDeterministic(address(_clonableTUPTemplate), salt);

        address anotherImplementation = address(new EnsoWallet());
        IClonableTransparentUpgradeableProxy(clone).initialize(anotherImplementation, _admin);

        IEnsoWallet(clone).initialize(address(80085), new bytes32[](0), new bytes[](0));
        assertEq(IEnsoWallet(clone).caller(), address(80085));
    }

    function testCloneThenUpgrade() public {
        bytes32 salt = keccak256(abi.encode("first 4 of my social"));        
        address clone = Clones.cloneDeterministic(address(_clonableTUPTemplate), salt);

        address anotherImplementation = address(new EnsoShortcutsHelper());
        IClonableTransparentUpgradeableProxy(clone).initialize(anotherImplementation, _admin);

        assertEq(
            IEnsoShortcutsHelper(clone).getBlockTimestamp(), 
            IEnsoShortcutsHelper(anotherImplementation).getBlockTimestamp());

        address newImplementation = address(new EnsoWallet());
        vm.startPrank(_admin);
        ITransparentUpgradeableProxy(clone).upgradeTo(newImplementation);
        vm.stopPrank();

        IEnsoWallet(clone).initialize(address(80085), new bytes32[](0), new bytes[](0));
        assertEq(IEnsoWallet(clone).caller(), address(80085));
    }
}
