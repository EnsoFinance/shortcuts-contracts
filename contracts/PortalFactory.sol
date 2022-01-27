pragma solidity ^0.8.4;

import "./Portal.sol";

contract PortalFactory {
    address public vm;

    constructor(address _vm) public {
        vm = _vm;
    }

    event Deployed(address addr, address sender);

    function getBytecode(uint _salt, bytes32[] calldata commands, bytes[] memory state) 
        public 
        view 
        returns (bytes memory) 
    {
        bytes memory bytecode = type(Portal).creationCode;

        return abi.encodePacked(bytecode, abi.encode(msg.sender, commands, state));
    }

    function getAddress(bytes memory bytecode)
        public
        view
        returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), keccak256(abi.encodePacked(msg.sender)), keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function deploy(bytes memory bytecode) 
        public 
        payable 
    {
        address addr;
        bytes32 salt = keccak256(abi.encodePacked(msg.sender));

        assembly {
            addr := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        emit Deployed(addr, msg.sender);
    }
}