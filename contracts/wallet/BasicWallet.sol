// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "../access/Ownable.sol";

contract BasicWallet is Ownable, ERC721Holder, ERC1155Holder {
    using SafeERC20 for IERC20;

    enum Protocol {
        ETH,
        ERC20,
        ERC721,
        ERC1155
    }

    struct Note {
        Protocol protocol;
        address token;
        uint256[] ids;
        uint256[] amounts;
    }

    error WithdrawFailed();
    error InvalidArrayLength();

    ////////////////////////////////////////////////////
    // External functions //////////////////////////////
    ////////////////////////////////////////////////////

    function withdraw(Note[] memory notes) external onlyOwner {
        Note memory note;
        Protocol protocol;
        uint256[] memory ids;
        uint256[] memory amounts;

        uint256 length = notes.length;
        for (uint256 i; i < length; ) {
            note = notes[i];
            protocol = note.protocol;
            if (protocol == Protocol.ETH) {
                amounts = note.amounts;
                if (amounts.length != 1) revert InvalidArrayLength();
                _withdrawETH(amounts[0]);
            } else if (protocol == Protocol.ERC20) {
                amounts = note.amounts;
                if (amounts.length != 1) revert InvalidArrayLength();
                _withdrawERC20(IERC20(note.token), amounts[0]);
            } else if (protocol == Protocol.ERC721) {
                ids = note.ids;
                _withdrawERC721s(IERC721(note.token), ids);
            } else if (protocol == Protocol.ERC1155) {
                ids = note.ids;
                amounts = note.amounts;
                _withdrawERC1155s(IERC1155(note.token), ids, amounts);
            }
            unchecked { ++i; }
        }
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        _withdrawETH(amount);
    }

    function withdrawERC20s(
        IERC20[] memory erc20s,
        uint256[] memory amounts
    ) external onlyOwner {
        uint256 length = erc20s.length;
        if (amounts.length != length) revert InvalidArrayLength();
        for (uint256 i; i < length; ) {
            _withdrawERC20(erc20s[i], amounts[i]);
            unchecked { ++i; }
        }
    }

    function withdrawERC721s(
        IERC721 erc721,
        uint256[] memory ids
    ) external onlyOwner {
        _withdrawERC721s(erc721, ids);
    }

    function withdrawERC1155s(
        IERC1155 erc1155,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyOwner {
        _withdrawERC1155s(erc1155, ids, amounts);
    }

    ////////////////////////////////////////////////////
    // Internal functions //////////////////////////////
    ////////////////////////////////////////////////////

    function _withdrawETH(uint256 amount) internal {
        (bool success, ) = msg.sender.call{ value : amount }("");
        if (!success) revert WithdrawFailed();
    }

    function _withdrawERC20(
        IERC20 erc20,
        uint256 amount
    ) internal {
        erc20.safeTransfer(msg.sender, amount);
    }

    function _withdrawERC721s(
        IERC721 erc721,
        uint256[] memory ids
    ) internal {
        uint256 length = ids.length;
        for (uint256 i; i < length; ) {
            erc721.safeTransferFrom(address(this), msg.sender, ids[i]);
            unchecked { ++i; }
        }
    }

    function _withdrawERC1155s(
        IERC1155 erc1155,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal {
        // safeBatchTransferFrom will validate the array lengths
        erc1155.safeBatchTransferFrom(address(this), msg.sender, ids, amounts, "");
    }

    ////////////////////////////////////////////////////
    // Fallback functions //////////////////////////////
    ////////////////////////////////////////////////////

    receive() external payable {}
}
