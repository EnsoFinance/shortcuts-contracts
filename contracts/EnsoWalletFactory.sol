// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./EnsoWallet.sol";
import {Clones} from "./Libraries/Clones.sol";
import {ClonableTransparentUpgradeableProxy} from "./helpers/ClonableTransparentUpgradeableProxy.sol";

contract EnsoWalletFactory {
    using Clones for address;

    address public immutable ensoWallet;
    ClonableTransparentUpgradeableProxy private _clonableTUPTemplate;

    event Deployed(EnsoWallet instance);

    constructor(address EnsoWallet_) {
        ensoWallet = EnsoWallet_;
        _clonableTUPTemplate = new ClonableTransparentUpgradeableProxy(ensoWallet, address(this));
    }

    function deploy(address walletAdmin, bytes32[] calldata commands, bytes[] calldata state) public payable returns (EnsoWallet instance) {
        instance = EnsoWallet(payable(
          address(_clonableTUPTemplate).cloneDeterministic(msg.sender)
        ));
        ClonableTransparentUpgradeableProxy(payable(instance)).initialize(ensoWallet, walletAdmin);
        instance.initialize{value: msg.value}(msg.sender, commands, state);

        emit Deployed(instance);
    }

    function getAddress() public view returns (address payable) {
        return payable(address(_clonableTUPTemplate).predictDeterministicAddress(msg.sender, address(this)));
    }
}
