pragma solidity ^0.5.6;

import "./KIP17.sol";
import "./KIP17Metadata.sol";
import "../utils/Counters.sol";
import "../utils/Context.sol";

contract KIP17Token is Context, KIP17, KIP17Metadata {

  using Counters for Counters.Counter;

  Counters.Counter private _tokenIds;

  constructor (string memory name, string memory symbol) public KIP17Metadata(name, symbol) {}

  function mint(string memory uri) public returns (uint256) {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();

    _mint(_msgSender(), newItemId);
    _setTokenURI(newItemId, uri);
  
    return newItemId;
  }

  function getCurrentTokenId() public view returns (uint256) {
    return _tokenIds.current();
  }
}