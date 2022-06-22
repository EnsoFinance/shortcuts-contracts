// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "./Portal.sol";
import {Clones} from "./Libraries/Clones.sol";

contract PortalFactory {
    using Clones for address;

    mapping(address => Portal) public user;
    address public immutable portalImplementation;
    address public immutable ensoVM;

    event Deployed(Portal instance);

    error AlreadyExists();

    constructor(address vm_, address portal_) {
        portalImplementation = portal_;
        ensoVM = vm_;
    }

    function deploy(bytes32[] calldata commands, bytes[] calldata state) public payable returns (Portal instance) {
        if (address(user[msg.sender]) != address(0)) {
            revert AlreadyExists();
        }

        instance = Portal(portalImplementation.cloneDeterministic(msg.sender));
        instance.initialize{value: msg.value}(ensoVM, msg.sender, commands, state);

        user[msg.sender] = instance;
        emit Deployed(instance);
    }

    function getAddress() public view returns (address) {
        return portalImplementation.predictDeterministicAddress(msg.sender, address(this));
    }
}
