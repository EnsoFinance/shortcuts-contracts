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
    address public caller;
    address public constant _VM = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;

    function initialize(address _caller, bytes32[] calldata commands, bytes[] memory state)
        external
    {
        if(init) revert PortalErrors.AlreadyInit();
        init = true;
        caller = _caller;
        _execute(commands, state);
    }

    function execute(bytes32[] calldata commands, bytes[] memory state)
        external
        returns (bytes[] memory)
    {
        if (caller != msg.sender) revert PortalErrors.NotCaller();
        
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
}