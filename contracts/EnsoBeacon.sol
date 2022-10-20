// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./interfaces/IBeacon.sol";

contract EnsoBeacon is IBeacon {
    address public admin;
    address public delegate;
    address public coreImplementation;
    address public fallbackImplementation;

    address public pendingAdmin;
    address public pendingDelegate;

    event CoreUpgraded(address previousImplementation, address newImplementation);
    event FallbackUpgraded(address previousImplementation, address newImplementation);
    event EmergencyUpgrade(address previousImplementation, address newImplementation);
    event AdminTransferred(address previousAdmin, address newAdmin);
    event AdminTransferStarted(address previousAdmin, address newAdmin);
    event DelegationTransferred(address previousDelegate, address newDelegate);
    event DelegationTransferStarted(address previousDelegate, address newDelegate);

    error InvalidImplementation();
    error InvalidAccount();
    error NotPermitted();

    modifier onlyAdmin {
        if (msg.sender != admin) revert NotPermitted();
        _;
    }

    modifier onlyDelegate {
        if (msg.sender != delegate) revert NotPermitted();
        _;
    }

    constructor(
        address coreImplementation_,
        address fallbackImplementation_
    ) {
        admin = msg.sender;
        delegate = msg.sender;
        coreImplementation = coreImplementation_;
        fallbackImplementation = fallbackImplementation_;
    }

    function implementation() external view override returns (address) {
        return coreImplementation;
    }

    function emergencyUpgrade() external onlyDelegate {
        address previousImplementation = coreImplementation;
        address newImplementation = fallbackImplementation;
        coreImplementation = newImplementation;
        emit CoreUpgraded(previousImplementation, newImplementation);
        emit EmergencyUpgrade(previousImplementation, newImplementation);
    }

    // TODO: update should probably be on a timelock for added security
    function upgradeCore(address newImplementation) external onlyAdmin {
        if (newImplementation == address(0)) revert InvalidImplementation();
        if (newImplementation == coreImplementation) revert InvalidImplementation();
        address previousImplementation = coreImplementation;
        coreImplementation = newImplementation;
        emit CoreUpgraded(previousImplementation, newImplementation);
    }

    function upgradeFallback(address newImplementation) external onlyAdmin {
        if (newImplementation == address(0)) revert InvalidImplementation();
        if (newImplementation == fallbackImplementation) revert InvalidImplementation();
        address previousImplementation = fallbackImplementation;
        fallbackImplementation = newImplementation;
        emit FallbackUpgraded(previousImplementation, newImplementation);
    }

    function transferAdministration(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert InvalidAccount();
        if (newAdmin == admin) revert InvalidAccount();
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    function acceptAdministration() external {
        if (msg.sender != pendingAdmin) revert NotPermitted();
        delete pendingAdmin;
        address previousAdmin = admin;
        admin = msg.sender;
        emit AdminTransferred(previousAdmin, msg.sender);
    }

    function transferDelegation(address newDelegate) external onlyAdmin {
        if (newDelegate == address(0)) revert InvalidAccount();
        if (newDelegate == delegate) revert InvalidAccount();
        pendingDelegate = newDelegate;
        emit DelegationTransferStarted(delegate, newDelegate);
    }

    function acceptDelegation() external {
        if (msg.sender != pendingDelegate) revert NotPermitted();
        delete pendingDelegate;
        address previousDelegate = delegate;
        delegate = msg.sender;
        emit DelegationTransferred(previousDelegate, msg.sender);
    }
}
