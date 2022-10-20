// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/BeaconClones.sol";
import "./access/Ownable.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWalletFactory is Ownable, UUPSUpgradeable {
    using StorageAPI for bytes32;
    using BeaconClones for address;

    address public immutable ensoBeacon;

    event Deployed(IEnsoWallet instance);

    // Already initialized
    error AlreadyInit();

    constructor(address ensoBeacon_) {
        ensoBeacon = ensoBeacon_;
    }

    function initialize() external {
        if (OWNER.getAddress() != address(0)) revert AlreadyInit();
        OWNER.setAddress(msg.sender);
    }

    function deploy(
        bytes32[] calldata commands,
        bytes[] calldata state
    ) public payable returns (IEnsoWallet instance) {
        instance = IEnsoWallet(payable(ensoBeacon.cloneDeterministic(msg.sender)));
        instance.initialize{ value: msg.value }(msg.sender, commands, state);
        emit Deployed(instance);
    }

    function getAddress() public view returns (address payable) {
        return getUserAddress(msg.sender);
    }

    function getUserAddress(address user) public view returns (address payable) {
        return payable(ensoBeacon.predictDeterministicAddress(
            user,
            address(this)
        ));
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        if (msg.sender != OWNER.getAddress()) revert NotOwner();
    }
}
