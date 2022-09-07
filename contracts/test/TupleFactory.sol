// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct Example {
    uint256 a;
    string b;
}

contract TupleFactory {
    uint256 exampleInt1 = 0xcafe;
    uint256 exampleInt2 = 0xdead;
    uint256 exampleInt3 = 0xbeef;
    string exampleString = "Hello World!Hello World!Hello World!Hello World!Hello World!"; // 5x "Hello World!"
    Example exampleStruct = Example(exampleInt1, exampleString);

    string[] exampleStringArray;
    uint[] exampleIntArray;
    Example[] exampleStructArray;
    bytes10 exampleBytes;

    constructor() {
        exampleStringArray.push(exampleString);
        exampleStringArray.push(exampleString);

        exampleIntArray.push(exampleInt1);
        exampleIntArray.push(exampleInt2);
        exampleIntArray.push(exampleInt3);

        exampleStructArray.push(Example(exampleInt1, exampleString));
        exampleStructArray.push(Example(exampleInt2, exampleString));
        exampleStructArray.push(Example(exampleInt3, exampleString));

        assembly {
            sstore(exampleBytes.slot, sload(exampleString.slot))
        }
    }

    function allTypesTuple()
        public
        view
        returns (
            uint256,
            string memory,
            uint256[] memory,
            string[] memory,
            Example memory,
            Example[] memory
        )
    {
        return (exampleInt1, exampleString, exampleIntArray, exampleStringArray, exampleStruct, exampleStructArray);
    }
}