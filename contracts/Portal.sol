pragma solidity ^0.8.4;

interface VMInterface {
    function execute(bytes32[] calldata commands, bytes[] memory state) external returns (bytes[] memory);
}

interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface INetherFactory {
    function vm() external view returns(address);
}

contract Portal {
    address public owner;
    INetherFactory public factory;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(address _owner) public {
        factory = INetherFactory(msg.sender);
        owner = _owner;
    }

    function execute(bytes32[] calldata commands, bytes[] memory state)
        public
        onlyOwner
        returns (bytes[] memory)
    {
        (bool success, bytes memory data) = factory.vm().delegatecall(
            abi.encodeWithSelector(VMInterface.execute.selector, commands, state)
        );
        require(success);

        return abi.decode(data, (bytes[]));
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