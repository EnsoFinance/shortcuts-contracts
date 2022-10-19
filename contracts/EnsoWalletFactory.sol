// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./libraries/BeaconClones.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWalletFactory {
    using BeaconClones for address;

    address public immutable ensoBeacon;

    event Deployed(IEnsoWallet instance);

    constructor(address ensoBeacon_) {
        ensoBeacon = ensoBeacon_;
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
}
