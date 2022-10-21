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

    function withdraw(Note[] memory notes) external onlyOwner {
        uint256 notesLength = notes.length;
        uint256 idsLength;

        Note memory note;
        Protocol protocol;
        uint256[] memory ids;
        uint256[] memory amounts;
        for (uint256 i; i < notesLength; ) {
            note = notes[i];
            protocol = note.protocol;
            amounts = note.amounts;
            ids = note.ids;
            if (protocol == Protocol.ETH) {
                if (amounts.length != 1) revert InvalidArrayLength();
                (bool success, ) = msg.sender.call{ value : amounts[0] }("");
                if (!success) revert WithdrawFailed();
            } else if (protocol == Protocol.ERC20) {
                if (amounts.length != 1) revert InvalidArrayLength();
                IERC20(note.token).safeTransfer(msg.sender, amounts[0]);
            } else if (protocol == Protocol.ERC721) {
                idsLength = ids.length;
                for (uint j; j < idsLength; ) {
                    IERC721(note.token).safeTransferFrom(address(this), msg.sender, ids[j]);
                    unchecked { ++j; }
                }
            } else if (protocol == Protocol.ERC1155) {
                idsLength = ids.length;
                if (amounts.length != idsLength) revert InvalidArrayLength();
                for (uint j; j < idsLength; ) {
                    IERC1155(note.token).safeTransferFrom(address(this), msg.sender, ids[j], amounts[j], "");
                    unchecked { ++j; }
                }
            }
            unchecked { ++i; }
        }
    }

    receive() external payable {}
}
