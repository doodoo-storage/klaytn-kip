pragma solidity ^0.5.6;

/** ERC721 interface 기반의 contract와 safeTransfer를 지원하기 위한 interface */
contract IERC721Receiver {
  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public returns (bytes4);
}
