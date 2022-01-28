pragma solidity ^0.8.4;

library PortalErrors {
    // Not caller
    error NotCaller();
}

interface IVM {
    function execute(bytes32[] calldata commands, bytes[] memory state) external returns (bytes[] memory) ;
}

contract Portal {
    mapping (address=>bool) public caller;
    address public constant _VM = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;

    event Added(address caller, address sender);
    event Removed(address caller, address sender);
}