pragma solidity ^0.8.4;

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol#L39

import "./Portal.sol";
import {Clones} from './Libraries/Clones.sol';

library FactoryErrors {
    // Not caller
    error AlreadyExists();
}

contract PortalFactory {
    using Clones for address;
    
    mapping (address=>address) public user;
    address public constant PORTAL = 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707;

    event Deployed(address instance);

    function getAddress() 
        public
        view
        returns(address)
    {
        return PORTAL.predictDeterministicAddress(msg.sender, address(this));
    }

    function deploy(bytes memory init)
        public
        payable
    {
        if(user[msg.sender] != address(0)) revert FactoryErrors.AlreadyExists();

        address instance = PORTAL.cloneDeterministic(msg.sender);

        (bool success, bytes memory data) = instance.call{value:msg.value}(init);
        require(success);

        user[msg.sender] = instance;
        emit Deployed(instance);
    }
}