pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Utils {
    using SafeMath for uint256;

    function maxWithKey(uint256 aKey, uint256 a, uint256 bKey, uint256 b) public pure returns (uint256 key, uint256 value) {
        uint256 max = Math.max(a, b);

        if (max == a) return (aKey, a);
        return (bKey, b);
    }

    function add(uint256 a, uint256 b) public pure returns (uint256) {return a + b;}
    function sub(uint256 a, uint256 b) public pure returns (uint256) {return a - b;}
    function mul(uint256 a, uint256 b) public pure returns (uint256) {return a * b;}

    function extractElement(bytes memory tuple, uint256 index)
        public
        pure
        returns (bytes32)
    {
        assembly {
            return(add(tuple, mul(add(index, 1), 32)), 32)
        }
    }

    function bytes32ToUint256(bytes32 input) public pure returns (uint256) {return uint256(input);}
    function bytes32ToString(bytes32 input) public pure returns (string memory) {return string(abi.encodePacked(input));}
}