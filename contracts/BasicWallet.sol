// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./libraries/StorageAPI.sol";

contract BasicWallet {
    using StorageAPI for bytes32;
    using SafeERC20 for IERC20;

    // Using same slot generation technique as eip-1967 -- https://eips.ethereum.org/EIPS/eip-1967
    bytes32 internal constant OWNER = bytes32(uint256(keccak256("enso.wallet.owner")) - 1);

    error NotOwner();
    error WithdrawFailed();

    modifier onlyOwner {
        if (msg.sender != OWNER.getAddress()) revert NotOwner();
        _;
    }

    function withdrawETH() external onlyOwner {
        (bool success, ) = msg.sender.call{ value : address(this).balance }("");
        if (!success) revert WithdrawFailed();
    }

    function withdrawERC20s(IERC20[] memory erc20s) external onlyOwner {
        uint256 num = erc20s.length;

        IERC20 erc20;
        uint256 balance;
        for (uint256 i; i < num; ) {
            erc20 = erc20s[i];
            balance = erc20.balanceOf(address(this));
            if (balance > 0) erc20.safeTransfer(msg.sender, balance);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawERC721s(IERC721 erc721, uint256[] memory ids) external onlyOwner {
        uint256 num = ids.length;

        for (uint256 i; i < num; ) {
            erc721.safeTransferFrom(address(this), msg.sender, ids[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawERC1155s(IERC1155 erc1155, uint256[] memory ids) external onlyOwner {
        uint256 num = ids.length;

        uint256 id;
        uint256 balance;
        for (uint256 i; i < num; ) {
            id = ids[i];
            balance = erc1155.balanceOf(address(this), id);
            if (balance > 0)
                erc1155.safeTransferFrom(address(this), msg.sender, id, balance, new bytes(0));
            unchecked {
                ++i;
            }
        }
    }

    receive() external payable {}
}
