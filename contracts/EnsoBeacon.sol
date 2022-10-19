// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./interfaces/IBeacon.sol";

contract EnsoBeacon is IBeacon {
    address public governance;
    address public executive;
    address public coreImplementation;
    address public fallbackImplementation;

    event NewCore(address newImplementation);
    event NewFallback(address newImplementation);
    event NewGovernance(address newGovernance);
    event NewExecutive(address newExecutive);

    error InvalidImplementation();
    error InvalidAccount();
    error NotPermitted();

    modifier onlyGovernance {
        if (msg.sender != governance) revert NotPermitted();
        _;
    }

    modifier onlyExecutive {
        if (msg.sender != executive) revert NotPermitted();
        _;
    }

    constructor(
        address coreImplementation_,
        address fallbackImplementation_
    ) {
        governance = msg.sender;
        executive = msg.sender;
        coreImplementation = coreImplementation_;
        fallbackImplementation = fallbackImplementation_;
    }

    function implementation() external view override returns (address) {
        return coreImplementation;
    }

    function emergencyStop() external onlyExecutive {
        coreImplementation = fallbackImplementation;
        emit NewCore(fallbackImplementation);
    }

    // TODO: update should probably be on a timelock for added security
    function updateCore(address newImplementation) external onlyGovernance {
        if (newImplementation == address(0)) revert InvalidImplementation();
        if (newImplementation == coreImplementation) revert InvalidImplementation();
        coreImplementation = newImplementation;
        emit NewCore(newImplementation);
    }

    function updateFallback(address newImplementation) external onlyGovernance {
        if (newImplementation == address(0)) revert InvalidImplementation();
        if (newImplementation == fallbackImplementation) revert InvalidImplementation();
        fallbackImplementation = newImplementation;
        emit NewFallback(newImplementation);
    }

    // TODO: switch to 2 step process?
    function updateGovernance(address newGovernance) external onlyGovernance {
        if (newGovernance == address(0)) revert InvalidAccount();
        if (newGovernance == executive) revert InvalidAccount();
        executive = newGovernance;
        emit NewGovernance(newGovernance);
    }

    // TODO: switch to 2 step process?
    function updateExecutive(address newExecutive) external onlyGovernance {
        if (newExecutive == address(0)) revert InvalidAccount();
        if (newExecutive == executive) revert InvalidAccount();
        executive = newExecutive;
        emit NewExecutive(newExecutive);
    }
}
