pragma solidity ^0.5.6;

import "./IKIP17.sol";

contract IKIP17Metadata is IKIP17 {
  function name() external view returns (string memory);
  function symbol() external view returns (string memory);
  function tokenURI(uint256 tokenId) external view returns (string memory);
}
