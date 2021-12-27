// SPDX-License-Identifier: MIT
pragma solidity ^0.5.6;

import "../introspection/IKIP13.sol";

contract IERC1155Receiver is IKIP13 {
    /**
     * ERC1155 토큰의 수신에 대한 처리
     * 금액이 업데이트 된 후 safeTransferFrom에서 호출
     */
    function onERC1155Received(
      address operator, address from, 
      uint256 id, uint256 value, bytes calldata data
    ) external returns (bytes4);

    /**
     * ERC1155 토큰의 수신에 대한 처리
     * 금액이 업데이트 된 후 safeBatchTransferFrom에서 호출
     */    
    function onERC1155BatchReceived(
        address operator, address from,
        uint256[] calldata ids, uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}
