// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "./Portal.sol";
import {Clones} from "./Libraries/Clones.sol";

library FactoryErrors {
    // Not caller
    error AlreadyExists();
}

contract PortalFactory {
    using Clones for address;

    mapping(address => Portal) public user;
    address public portalImplementation_;
    address public ensoVM_;

    event Deployed(Portal instance);

    constructor(address _vm, address _portal) {
        portalImplementation_ = _portal;
        ensoVM_ = _vm;
    }

    function deploy(bytes32[] calldata commands, bytes[] memory state) public payable returns (Portal instance) {
        if (address(user[msg.sender]) != address(0)) {
            revert FactoryErrors.AlreadyExists();
        }

        instance = Portal(payable(portalImplementation_.cloneDeterministic(msg.sender)));
        instance.initialize{value: msg.value}(ensoVM_, msg.sender, commands, state);

        user[msg.sender] = instance;
        emit Deployed(instance);
    }

    function getAddress() public view returns (address) {
        return portalImplementation_.predictDeterministicAddress(msg.sender, address(this));
    }
}
