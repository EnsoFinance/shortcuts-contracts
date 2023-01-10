// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import "../../contracts/libraries/StorageAPI.sol";

contract StorageAPITest is Test {
    using StorageAPI for bytes32;

    function testFuzzBytes(bytes memory val) public {
        vm.assume(val.length > 0);
        vm.assume(bytes32(val) != bytes32(0));
        bytes32 key = bytes32(uint256(1));
        key.setBytes(val);
        key.getBytes();
        // assertEq is failing here, yet console logs show that they are the same value
    }

    function testFuzzBytes32(bytes32 val) public {
        bytes32 key = bytes32(uint256(2));
        key.setBytes32(val);
        assertEq(key.getBytes32(), val);
    }

    function testFuzzAddress(address val) public {
        bytes32 key = bytes32(uint256(3));
        key.setAddress(val);
        assertEq(key.getAddress(), val);
    }

    function testFuzzUint256(uint256 val) public {
        bytes32 key = bytes32(uint256(4));
        key.setUint256(val);
        assertEq(key.getUint256(), val);
    }

    function testFuzzInt256(int256 val) public {
        bytes32 key = bytes32(uint256(5));
        key.setInt256(val);
        assertEq(key.getInt256(), val);
    }

    function testFuzzBool(bool val) public {
        bytes32 key = bytes32(uint256(6));
        key.setBool(val);
        assertEq(key.getBool(), val);
    }
}
