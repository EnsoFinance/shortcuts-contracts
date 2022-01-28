pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./VM.sol";

library PortalErrors {
    // Not caller
    error NotCaller();
}


contract Portal {
    mapping (address=>bool) public caller;
    address public constant _VM = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;

    event Added(address caller, address sender);
    event Removed(address caller, address sender);

    constructor(address _owner) {
        caller[msg.sender] = true;
        caller[_owner] = true;
    }

    function execute(bytes32[] calldata commands, bytes[] memory state)
        public
        returns (bytes[] memory)
    {
        if (!caller[msg.sender]) revert PortalErrors.NotCaller();
        
        return _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] memory state)
        internal
        returns (bytes[] memory)   
    {
        (bool success, bytes memory data) = _VM.delegatecall(
            abi.encodeWithSelector(VM.execute.selector, commands, state)
        );
        
        if (!success) {
            assembly {
                revert(add(32, data), mload(data))
            }
        }

        return abi.decode(data, (bytes[]));
    }

    function removeCaller(address _caller) 
        public
    {
        if (!caller[msg.sender]) revert PortalErrors.NotCaller();
        delete caller[_caller]; // do not verify if entry: save gas
        emit Removed(_caller, msg.sender);
    }
    function addCaller(address _caller) 
        public
    {
        if (!caller[msg.sender]) revert PortalErrors.NotCaller();
        caller[msg.sender] = true;
        emit Added(_caller, msg.sender);
    }
}