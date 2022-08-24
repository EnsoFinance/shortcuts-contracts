// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Owned} from "@rari-capital/solmate/src/auth/Owned.sol";

contract Utils is Owned(msg.sender) {
    mapping(string=>address) utils;

    function updateUtils(string calldata util, address impl) public onlyOwner {
        utils[util] = impl;
    }

    function call(string calldata util, bytes calldata data) external view returns(bytes memory) {
        address utilAddress = utils[util];

        if (utilAddress == address(0)) revert (string.concat('enso: util "', util, '" does not exist'));

        bool success;
        bytes memory outdata;
        (success, outdata) = utilAddress.staticcall(data);
        
        if (!success) {
                if (outdata.length > 0) {
                    assembly {
                        outdata := add(outdata, 68)
                    }
                }
                revert (outdata.length > 0 ? string(outdata) : "Unknown");
            }

        return outdata;
    }
}
