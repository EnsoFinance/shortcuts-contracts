pragma solidity ^0.8.4;

import "./Portal.sol";

contract PortalFactory {
    address public vm;
    mapping (address=>address) public user;

    constructor(address _vm) public {
        vm = _vm;
    }

    event Deployed(address addr, address sender);

    function getBytecode(bytes32[] calldata commands, bytes[] memory state)
        public 
        view 
        returns (bytes memory) 
    {
        bytes memory bytecode = type(Portal).creationCode;

        return abi.encodePacked(bytecode, abi.encode(msg.sender, commands, state));
    }

    function getAddress(bytes memory bytecode, uint _salt)
        public
        view
        returns (address)
    {
        if(user[msg.sender] != address(0)){
            return user[msg.sender];
        }
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function deploy(bytes memory bytecode, uint _salt) 
        public 
        payable 
    {
        require(user[msg.sender] == address(0), 'PortalFactory#deploy: already deployed');
        address addr;

        assembly {
            addr := create2(0, add(bytecode, 32), mload(bytecode), _salt)
        }
        user[msg.sender] = addr;
        emit Deployed(addr, msg.sender);
    }
}

/*
    TODO:
        - introduce salts
*/