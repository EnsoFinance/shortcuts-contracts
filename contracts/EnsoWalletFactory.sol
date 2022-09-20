// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./EnsoWallet.sol";
import { IBeacon, Proxy } from "./proxy/Proxy.sol";

contract EnsoWalletFactory is IBeacon {

    address public ensoWallet;
    mapping(address => address) internal _implementations;

    event Deployed(EnsoWallet instance);

    constructor(address ensoWallet_) {
        ensoWallet = ensoWallet_;
    }

    function deploy(bytes32[] calldata commands, bytes[] calldata state) public payable returns (EnsoWallet instance) {
        try new Proxy{ salt: keccak256(abi.encodePacked(msg.sender)) }() returns (Proxy proxy) {
            _implementations[address(proxy)] = ensoWallet;
            instance = EnsoWallet(payable(address(proxy)));
            instance.initialize{ value: msg.value }(msg.sender, commands, state);
            emit Deployed(instance);
        } catch {
            revert("create2 failed");
        }
    }

    function implementation() external view override returns (address) {
        return _implementations[msg.sender];
    }

    function getAddress() public view returns (address) {
        return _calculateAddress(msg.sender);
    }

    // Pre-calculate the proxy address
    function _calculateAddress(address account)
        internal
        view
        returns (address payable)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
              bytes1(0xff),
              address(this),
              keccak256(abi.encodePacked(account)),
              keccak256(abi.encodePacked(
                type(Proxy).creationCode
              )))
        );

        // NOTE: cast last 20 bytes of hash to address
        return payable(address(uint160(uint256(hash))));
    }
}
