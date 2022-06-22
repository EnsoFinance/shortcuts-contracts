// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;


contract Destroyer {
    function kill() public returns (bytes[] memory data) {
        selfdestruct(payable(msg.sender));
        return data;
    }
}


contract DestructVM {

    event DelegateCallReturn(bool success, bytes ret);

    function execute(bytes32[] calldata commands, bytes[] calldata state) public returns (bytes[] memory data) {
        Destroyer destroyer = new Destroyer();
            (bool success, bytes memory ret)  =  address(destroyer).delegatecall(abi.encodeWithSelector(destroyer.kill.selector, commands, state));
        emit DelegateCallReturn(success, ret);        
        return data;
    }
}