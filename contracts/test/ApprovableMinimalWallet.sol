// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.16;

import "../wallet/MinimalWallet.sol";

contract ApprovableMinimalWallet is MinimalWallet {
    function approveERC20(IERC20 erc20, address spender) external {
        erc20.approve(spender, type(uint256).max);
    }

    function approveERC721(IERC721 erc721, address spender) external {
        erc721.setApprovalForAll(spender, true);
    }

    function approveERC1155(IERC1155 erc1155, address spender) external {
        erc1155.setApprovalForAll(spender, true);
    }
}
