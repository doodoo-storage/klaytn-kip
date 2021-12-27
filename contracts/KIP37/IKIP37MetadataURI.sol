// SPDX-License-Identifier: MIT
pragma solidity ^0.5.6;

import "./IKIP37.sol";

contract IKIP37MetadataURI is IKIP37 {
  function uri(uint256 id) external view returns (string memory);
}
