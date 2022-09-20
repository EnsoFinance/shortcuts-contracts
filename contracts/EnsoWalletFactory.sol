// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./proxy/Proxy.sol";

contract EnsoWalletFactory {

    address public ensoWallet;

    event Deployed(address instance);

    constructor(address ensoWallet_) {
        ensoWallet = ensoWallet_;
    }

    function deploy(bytes32[] calldata commands, bytes[] calldata state) public payable returns (address instance) {
        try new Proxy{ salt: keccak256(abi.encodePacked(msg.sender)) }() returns (Proxy proxy) {
            proxy.upgradeToAndCall{ value: msg.value }(ensoWallet, abi.encodeWithSelector(
                bytes4(keccak256("initialize(address,bytes32[],bytes[])")),
                msg.sender,
                commands,
                state
            ));
            instance = address(proxy);
            emit Deployed(instance);
        } catch {
            revert("create2 failed");
        }
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
