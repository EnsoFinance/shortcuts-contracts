pragma solidity ^0.8.4;

/*
    Registry of commands:
        - portal has associated commands
        - manager has associated portals
*/


library RegistryErrors {
    // Not created in factory
    error NotCreated();
}

interface IPortalFactory {
    function caller(address) returns(bool);
}


contract Registry {
    address public constant _FACTORY = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;

    mapping (address=>bytes32[]) public identifiers;

    event Registered(address portal, bytes32 identifier, uint8 index);

    function register(bytes32 identifier) 
        external
    {
        if(!_FACTORY.created(msg.sender)) revert RegistryErrors.NotCreated();
        
        uint8 len = identifiers[msg.sender] + 1;
        identifiers[len].push(identifier);

        emit Registered(msg.sender, identifier, len);
    }
}