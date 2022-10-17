// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

// TODO: switch to Ownable2Step when available
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/UpgradeableClones.sol";
//import "./interfaces/IBeacon.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWalletFactory is Ownable {
    using UpgradeableClones for address;

    address public ensoWallet;

    event Deployed(IEnsoWallet instance);
    event Upgrade(address newWallet);

    error InvalidImplementation();

    constructor(address ensoWallet_) {
        ensoWallet = ensoWallet_;
    }

    function deploy(
        bytes32[] calldata commands,
        bytes[] calldata state
    ) public payable returns (IEnsoWallet instance) {
        instance = IEnsoWallet(payable(ensoWallet.cloneDeterministic(msg.sender)));
        instance.initialize{ value: msg.value }(msg.sender, commands, state);
        emit Deployed(instance);
    }

    /*
    function implementation() external view override returns (address) {
        return ensoWallet;
    }
    */

    // TODO: upgrade should probably be on a timelock for added security
    function upgrade(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert InvalidImplementation();
        if (newWallet == ensoWallet) revert InvalidImplementation();
        ensoWallet = newWallet;
        emit Upgrade(newWallet);
    }

    function getAddress() public view returns (address payable) {
        return getUserAddress(msg.sender);
    }

    function getUserAddress(address user) public view returns (address payable) {
        return payable(ensoWallet.predictDeterministicAddress(
            user,
            address(this)
        ));
    }
}
