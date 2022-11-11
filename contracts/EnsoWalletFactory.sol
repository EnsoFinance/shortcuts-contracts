// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/BeaconClones.sol";
import "./access/Ownable.sol";
import "./interfaces/IEnsoWallet.sol";

contract EnsoWalletFactory is Ownable, UUPSUpgradeable {
    using StorageAPI for bytes32;
    using BeaconClones for address;

    address public immutable ensoBeacon;

    event Deployed(IEnsoWallet instance, string label);

    error AlreadyInit();
    error NoLabel();

    constructor(address ensoBeacon_) {
        ensoBeacon = ensoBeacon_;
    }

    function initialize() external {
        if (OWNER.getAddress() != address(0)) revert AlreadyInit();
        OWNER.setAddress(msg.sender);
    }

    function deploy(
        bytes32[] calldata commands,
        bytes[] calldata state
    ) public payable returns (IEnsoWallet) {
        bytes32 salt = bytes32(uint256(uint160(msg.sender)));
        return _deploy(salt, "", commands, state);
    }

    function deployCustom(
        string memory label,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) public payable returns (IEnsoWallet) {
        if (bytes(label).length == 0) revert NoLabel();
        bytes32 salt = _customSalt(msg.sender, label);
        return _deploy(salt, label, commands, state);
    }

    function getAddress() public view returns (address payable) {
        return getUserAddress(msg.sender);
    }

    function getUserAddress(address user) public view returns (address payable) {
        bytes32 salt = bytes32(uint256(uint160(user)));
        return _predictDeterministicAddress(salt);
    }

    function getCustomAddress(address user, string memory label) external view returns (address payable) {
        if (bytes(label).length == 0) revert NoLabel();
        bytes32 salt = _customSalt(user, label);
        return _predictDeterministicAddress(salt);
    }

    function _deploy(
        bytes32 salt,
        string memory label,
        bytes32[] calldata commands,
        bytes[] calldata state
    ) internal returns (IEnsoWallet instance) {
        instance = IEnsoWallet(payable(ensoBeacon.cloneDeterministic(salt)));
        instance.initialize{ value: msg.value }(msg.sender, salt, commands, state);
        emit Deployed(instance, label);
    }

    function _customSalt(address user, string memory label) internal pure returns (bytes32) {
        return keccak256(abi.encode(user, label));
    }

    function _predictDeterministicAddress(bytes32 salt) internal view returns (address payable) {
        return payable(ensoBeacon.predictDeterministicAddress(
            salt,
            address(this)
        ));
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        if (msg.sender != OWNER.getAddress()) revert NotOwner();
    }
}
