pragma solidity ^0.8.4;

import "./Portal.sol";

contract PortalFactory {
    mapping (address=>address) public user;

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

    function deploy(bytes32[] calldata commands, bytes[] memory state)
        public 
        payable 
    {
        require(user[msg.sender] == address(0), 'PortalFactory#deploy: already deployed');
        // deploy create2
        Portal portal = new Portal{salt: salt(msg.sender)}(msg.sender);
        // execute calls
        portal.execute(commands, state);
        // remove factory as caller
        portal.removeCaller(address(this));
        // update stored portal for user
        user[msg.sender] = address(portal);
        emit Deployed(address(portal), msg.sender);
    }
    function salt(address _user) public pure returns (bytes32) {
      return keccak256(abi.encode(_user));
    }
}