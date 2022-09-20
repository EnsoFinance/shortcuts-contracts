// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./EnsoWallet.sol";
import "./libraries/BeaconClones.sol";
import "./interfaces/IBeacon.sol";

contract EnsoWalletFactory is IBeacon {

    address public ensoWallet;

    event Deployed(EnsoWallet instance);

    constructor(address ensoWallet_) {
        ensoWallet = ensoWallet_;
    }

    function deploy(bytes32[] calldata commands, bytes[] calldata state) public payable returns (EnsoWallet instance) {
        instance = EnsoWallet(payable(BeaconClones.cloneDeterministic(address(this), msg.sender)));
        instance.initialize{value: msg.value}(msg.sender, commands, state);

        emit Deployed(instance);
    }

    function implementation() external view override returns (address) {
        return ensoWallet;
    }

    function getAddress() public view returns (address) {
        return payable(BeaconClones.predictDeterministicAddress(address(this), msg.sender));
    }
}
