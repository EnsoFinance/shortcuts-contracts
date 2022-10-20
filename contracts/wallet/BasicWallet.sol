// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "../access/Ownable.sol";

contract BasicWallet is Ownable, ERC721Holder, ERC1155Holder {
    using StorageAPI for bytes32;
    using SafeERC20 for IERC20;

    error WithdrawFailed();
    error InvalidArrayLength();

    function withdrawETH(uint256 amount) external onlyOwner {
        (bool success, ) = msg.sender.call{ value : amount }("");
        if (!success) revert WithdrawFailed();
    }

    function withdrawERC20s(
        IERC20[] memory erc20s,
        uint256[] memory amounts
    ) external onlyOwner {
        uint256 num = erc20s.length;
        if (amounts.length != num) revert InvalidArrayLength();
        for (uint256 i; i < num; ) {
            erc20s[i].safeTransfer(msg.sender, amounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawERC721s(
        IERC721 erc721,
        uint256[] memory ids
    ) external onlyOwner {
        uint256 num = ids.length;
        for (uint256 i; i < num; ) {
            erc721.safeTransferFrom(address(this), msg.sender, ids[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdrawERC1155s(
        IERC1155 erc1155,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyOwner {
        // safeBatchTransferFrom will validate the array lengths
        erc1155.safeBatchTransferFrom(address(this), msg.sender, ids, amounts, new bytes(0));
    }

    receive() external payable {}
}
