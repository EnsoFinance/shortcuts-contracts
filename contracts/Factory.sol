pragma solidity ^0.8.4;

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol#L39

import "./Portal.sol";
import {Clones} from './Libraries/Clones.sol';

library FactoryErrors {
    // Not caller
    error AlreadyExists();
}

contract Factory {
    using Clones for address;
    
    mapping (address=>address) public user;
    address public constant PORTAL = 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707;
    address public constant RECIPE = 0x0165878A594ca255338adfa4d48449f69242Eb8F;

    event DeployedPortal(address portal);
    event DeployedRecipe(address recipe);

    function deployCreate(bytes memory init, bytes memory init2)
        public
        payable
    {
        if(user[msg.sender] != address(0)) revert FactoryErrors.AlreadyExists();

        _portal(init);

        address recipe = RECIPE.cloneDeterministic(msg.sender);

        (bool success, bytes memory data) = recipe.call{value:msg.value}(init2);
        require(success);

        emit DeployedRecipe(recipe);
    }

    function deploy(bytes memory init)
        public
        payable
    {
        if(user[msg.sender] != address(0)) revert FactoryErrors.AlreadyExists();
        _portal(init);
    }

    function create(bytes memory init2) 
        public
        payable
    {
        address recipe = RECIPE.cloneDeterministic(msg.sender);

        (bool success, bytes memory data) = recipe.call{value:msg.value}(init2);
        require(success);

        emit DeployedRecipe(recipe);
    }

    function _portal(bytes memory init)
        internal
    {
        address portal = PORTAL.cloneDeterministic(msg.sender);

        (bool success, bytes memory data) = portal.call{value:msg.value}(init);
        require(success);

        user[msg.sender] = portal;
        emit DeployedPortal(portal);
    }

    function getPortal() 
        public
        view
        returns(address)
    {
        return PORTAL.predictDeterministicAddress(msg.sender, address(this));
    }

    function getRecipe() 
        public
        view
        returns(address)
    {
        return RECIPE.predictDeterministicAddress(msg.sender, address(this));
    }
}