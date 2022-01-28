// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "../Portal.sol";

contract Tasks is Portal{

    mapping(bytes32 => bool) internal tasks;

    event TaskSet(
      bytes32 indexed id,
      bytes32[] commands, 
      bytes[] state
    );
    
    event TaskUnset(
      bytes32 indexed id
    );
    
    function init(type name) {
        
    }

    /// @inheritdoc IAutoTaskList
    function set(bytes32[] calldata commands, bytes[] memory state) external onlyOwner override {
      bytes32 _id = keccak256(abi.encode(commands, state));
      tasks[_id] = true;
      emit TaskSet(_id, commands, state);
    }
    
    /// @inheritdoc IAutoTaskList
    function unset(bytes32[] calldata commands, bytes[] memory state) external onlyOwner override {
      bytes32 _id = keccak256(abi.encode(commands, state));
      tasks[_id] = false;
      emit TaskUnset(_id);
    }
    
    /// @inheritdoc IAutoTaskList
    function isSet(bytes32 _id) external view override returns (bool) {
      return tasks[_id];
    }
    
}