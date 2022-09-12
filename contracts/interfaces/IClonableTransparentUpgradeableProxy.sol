// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

interface IClonableTransparentUpgradeableProxy {
    function initialize(address _logic, address admin_) external;

    function getImplementation() external view returns(address);
} 
