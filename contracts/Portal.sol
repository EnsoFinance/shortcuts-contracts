pragma solidity ^0.8.4;

library PortalErrors {
    // Already initialized
    error AlreadyInit();
    // Not caller
    error NotCaller();
}

interface IVM {
    function execute(bytes32[] calldata commands, bytes[] memory state) external returns (bytes[] memory) ;
}

contract Portal {
    bool public init;
    mapping (address=>bool) public caller;
    address public constant _VM = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;

    event Added(address caller, address sender);
    event Removed(address caller, address sender);

    function initialize(address _caller, bytes32[] calldata commands, bytes[] memory state)
        public
    {
        if(init) revert PortalErrors.AlreadyInit();
        init = true;
        caller[_caller] = true;
        _execute(commands, state);
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
            abi.encodeWithSelector(IVM.execute.selector, commands, state)
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