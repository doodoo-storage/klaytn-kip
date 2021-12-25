pragma solidity ^0.5.6;

import "./KIP17.sol";
import "./IKIP17Metadata.sol";
import "../introspection/KIP13.sol";

contract KIP17Metadata is KIP13, KIP17, IKIP17Metadata {
    
  string private _name;
  string private _symbol;

  mapping(uint256 => string) private _tokenURIs;

  bytes4 private constant _INTERFACE_ID_KIP17_METADATA = 0x5b5e139f;

  constructor (string memory name, string memory symbol) public {
    _name = name;
    _symbol = symbol;

    // register the supported interfaces to conform to KIP17 via KIP13
    _registerInterface(_INTERFACE_ID_KIP17_METADATA);
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  function tokenURI(uint256 tokenId) external view returns (string memory) {
    require(_exists(tokenId), "KIP17Metadata: URI query for nonexistent token");
    return _tokenURIs[tokenId];
  }

  function _setTokenURI(uint256 tokenId, string memory uri) internal {
    require(_exists(tokenId), "KIP17Metadata: URI set of nonexistent token");
    _tokenURIs[tokenId] = uri;
  }

  function _burn(address owner, uint256 tokenId) internal {
    super._burn(owner, tokenId);

    // Clear metadata (if any)
    if (bytes(_tokenURIs[tokenId]).length != 0) {
        delete _tokenURIs[tokenId];
    }
  }
}
