pragma solidity ^0.8.4;

import "./Portal.sol";

contract PortalFactory {
    address public vm;
    mapping (address=>address) public user;

    constructor(address _vm) public {
        vm = _vm;
    }

    event Deployed(address addr, address sender);

    function getBytecode()
        public 
        view 
        returns (bytes memory) 
    {
        bytes memory bytecode = type(Portal).creationCode;

        return abi.encodePacked(bytecode, abi.encode(msg.sender));
    }

    function getAddress(bytes memory bytecode)
        public
        view
        returns (address)
    {
        if(user[msg.sender] != address(0)){
            return user[msg.sender];
        }

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt(msg.sender), keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function deploy(bytes32[] memory commands, bytes[] memory state)
        public 
        payable 
    {
        require(user[msg.sender] == address(0), 'PortalFactory#deploy: already deployed');
        Portal portal = new Portal{salt: salt(msg.sender)}(
                    msg.sender
                  );
        portal.execute(commands, state);
        user[msg.sender] = address(portal);
        emit Deployed(address(portal), msg.sender);
    }

    function salt(address _user) public pure returns (bytes32) {
      return keccak256(abi.encode(_user));
    }

}

/*
    TODO:
        - introduce salts
*/