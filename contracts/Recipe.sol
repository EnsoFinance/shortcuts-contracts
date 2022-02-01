// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

/*
    ERC721 from solmate(T11 tyty) - optimized further fyi.
    Custom recipe requirements
*/

library RecipeErrors {
    error AlreadyInit();
    // Not athrotized
    error NotAuthorized();
    // wrong from, and invalid address
    error Invalid();
}

contract Recipe {
    bool public init;
    uint256 public fee;
    string public name;
    string public symbol;                    
    bytes32[] public commands;

    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => address) public getApproved;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);

    function initialize(
        address _caller, 
        bytes32[] calldata _commands, 
        uint256 _fee, 
        string memory _name, 
        string memory _symbol
    )
        external
    {
        if(init) revert RecipeErrors.AlreadyInit();
        init = true;
        name = _name;
        symbol = _symbol;
        balanceOf[_caller] = 1; // might be cheaper to increment, should check
        ownerOf[0] = _caller;
        fee = _fee;
        commands = _commands;
    }

    function approve(address spender, uint256 id) public virtual {
        address owner = ownerOf[id];

        if(msg.sender != owner) revert RecipeErrors.NotAuthorized();

        getApproved[id] = spender;

        emit Approval(owner, spender, id);
    }

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        if(from != ownerOf[id]) revert RecipeErrors.Invalid();

        if(to == address(0)) revert RecipeErrors.Invalid();

        if(msg.sender != from || msg.sender != getApproved[id]) revert RecipeErrors.NotAuthorized();

        // Underflow of the sender's balance is impossible because we check for
        // ownership above and the recipient's balance can't realistically overflow.
        unchecked {
            balanceOf[from]--;

            balanceOf[to]++;
        }

        ownerOf[id] = to;

        delete getApproved[id];

        emit Transfer(from, to, id);
    }
    function getLength() 
        external
        view
        returns(uint256)
    {
        return commands.length;
    }

    function getCommands() 
        external
        view
        returns(bytes32[] memory)
    {
        return commands;
    }

    // function tokenURI(uint256 id) public view virtual returns (string memory);
}

/// @notice A generic interface for a contract which properly accepts ERC721 tokens.
/// @author Solmate (https://github.com/Rari-Capital/solmate/blob/main/src/tokens/ERC721.sol)
interface ERC721TokenReceiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 id,
        bytes calldata data
    ) external returns (bytes4);
}