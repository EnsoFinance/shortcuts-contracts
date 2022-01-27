pragma solidity ^0.8.4;

import "hardhat/console.sol";


interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IPortalFactory {
    function vm() external view returns(address);
}

import "./VM.sol";

library PortalErrors {
    // Not caller
    error NotCaller();
}


contract Portal {
    address public factory;
    mapping (address=>bool) public caller;

    event Added(address caller, address sender);
    event Removed(address caller, address sender);

    constructor(address _owner) {
        factory = msg.sender;
        caller[msg.sender] = true;
        caller[_owner] = true;
    }

    function execute(bytes32[] calldata commands, bytes[] memory state)
        public
        returns (bytes[] memory)
    {
        if (!caller[msg.sender]) revert PortalErrors.NotCaller();
        
        _execute(commands, state);
    }

    function _execute(bytes32[] calldata commands, bytes[] memory state)
        internal
        returns (bytes[] memory)   
    {
        (bool success, bytes memory data) = INetherFactory(factory).vm().delegatecall(
            abi.encodeWithSelector(VM.execute.selector, commands, state)
        );
        require(success);

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



/*
    Inside of the weiroll contract, we check first call and only first call
    to see if there is an approval contract associated with that user - need a 
    storage mapping inside of weiroll like a registry.
    Weiroll on first call, should also verify passed in token on first call
    that it is approved on the approval contract, and for the amount.
    Does not need to verify any future calls.

    1. approvalFactory
    2. approval contract
    3. 
    4. 



1. Approve address of "ApprovalContract" (get address via create2 https://docs.ethers.io/v5/api/utils/address/#utils-getCreate2Address)
2. Execute weiroll method
    2.1 compute address of "ApprovalContract" with tx.origin --> if not contract address deploy a new one
    2.2 transferFrom approvalContract (msg.sender == weiroll && tx.origin == owner)
    2.3 do something with funds inside weiroll
    2.4 transfer all funds to tx.origin
*/