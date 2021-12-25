pragma solidity ^0.5.6;

import "./IKIP17.sol";
import "./IERC721Receiver.sol";
import "./IKIP17Receiver.sol";
import "../math/SafeMath.sol";
import "../utils/Address.sol";
import "../utils/Counters.sol";
import "../utils/Context.sol";
import "../introspection/KIP13.sol";

contract KIP17 is Context, KIP13, IKIP17 {
    using SafeMath for uint256;
    using Address for address;
    using Counters for Counters.Counter;

    /**
     * bytes4(keccak256("onKIP17Received(address,address,uint256,bytes)")) = 0x6745782b
     * IKIP17Receiver(0).onKIP17Received.selector return value 
     */
    bytes4 private constant _KIP17_RECEIVED = 0x6745782b;

    /**
     * bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")) = 0x6745782b
     * IKIP17Receiver(0).onERC721Received.selector return value 
     */
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    /** tokenId와 owner의 wallet address mapping */
    mapping (uint256 => address) private _tokenOwner;

    /** tokenId와 approved 받은 user의 address mapping */
    mapping (uint256 => address) private _tokenApprovals;

    /** wallet address와 가지고 있는 token 갯수의 mapping */
    mapping (address => Counters.Counter) private _ownedTokensCount;

    /** user => user의 approval flag mapping */
    mapping (address => mapping (address => bool)) private _operatorApprovals;

    /** KIP17 interface의 keccak256 encoded value ^*/
    bytes4 private constant _INTERFACE_ID_KIP17 = 0x80ac58cd;

    constructor () public {
      /** kip13의 registerInface function을 통해 KIP17 Interface 준수 contract로 등록 */
      _registerInterface(_INTERFACE_ID_KIP17);
    }

    /** owner에 대한 해당 token의 balance 조회 */
    function balanceOf(address owner) public view returns (uint256) {
      require(owner != address(0), "KIP17: balance query for the zero address");
      return _ownedTokensCount[owner].current();
    }

    /** tokenId로 해당 token의 owner 조회 */
    function ownerOf(uint256 tokenId) public view returns (address) {
      address owner = _tokenOwner[tokenId];
      require(owner != address(0), "KIP17: owner query for nonexistent token");

      return owner;
    }

    /** to에게 해당 token의 권한을 넘김 */
    function approve(address to, uint256 tokenId) public {
      address owner = ownerOf(tokenId);
      require(to != owner, "KIP17: approval to current owner");

      require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()),
          "KIP17: approve caller is not owner nor approved for all"
      );

      _tokenApprovals[tokenId] = to;
      emit Approval(owner, to, tokenId);
    }

    /** 해당 token에 대한 권한을 가진 address를 조회 */
    function getApproved(uint256 tokenId) public view returns (address) {
      require(_exists(tokenId), "KIP17: approved query for nonexistent token");

      return _tokenApprovals[tokenId];
    }

    /** operator에게 msgSender의 전송 권한에 대해 설정 */
    function setApprovalForAll(address to, bool approved) public {
      require(to != _msgSender(), "KIP17: approve to caller");

      _operatorApprovals[_msgSender()][to] = approved;
      emit ApprovalForAll(_msgSender(), to, approved);
    }

    /** operator의 전송 권한을 확인 */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
      return _operatorApprovals[owner][operator];
    }

    /** from의 token을 to에게 전송 */
    function transferFrom(address from, address to, uint256 tokenId) public {
      //solhint-disable-next-line max-line-length
      require(_isApprovedOrOwner(_msgSender(), tokenId), "KIP17: transfer caller is not owner nor approved");

      _transferFrom(from, to, tokenId);
    }

    /**
     * 다른 contract로 token을 전송할 때 사용
     * onKIP17Received를 구현해놓은 contract여야만 전송 가능
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
      safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
      transferFrom(from, to, tokenId);
      require(_checkOnKIP17Received(from, to, tokenId, _data), "KIP17: transfer to non KIP17Receiver implementer");
    }

    /** 해당 tokenId의 owner가 존재하는지에 대한 확인 */
    function _exists(uint256 tokenId) internal view returns (bool) {
      address owner = _tokenOwner[tokenId];
      return owner != address(0);
    }

    /** spender가 해당 token의 관리 권한을 가지고 있는지에 대한 조회 */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
      require(_exists(tokenId), "KIP17: operator query for nonexistent token");
      address owner = ownerOf(tokenId);
      return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /** token 발행 */
    function _mint(address to, uint256 tokenId) internal {
      require(to != address(0), "KIP17: mint to the zero address");
      require(!_exists(tokenId), "KIP17: token already minted");

      _tokenOwner[tokenId] = to;
      _ownedTokensCount[to].increment();

      emit Transfer(address(0), to, tokenId);
    }

    /** token 소각 */
    function _burn(address owner, uint256 tokenId) internal {
      require(ownerOf(tokenId) == owner, "KIP17: burn of token that is not own");

      _clearApproval(tokenId);

      _ownedTokensCount[owner].decrement();
      _tokenOwner[tokenId] = address(0);

      emit Transfer(owner, address(0), tokenId);
    }

    /** token 소각 (ownerOf로 owner 조회) */
    function _burn(uint256 tokenId) internal {
      _burn(ownerOf(tokenId), tokenId);
    }

    /** contract 내에서 token에 대한 전송 */
    function _transferFrom(address from, address to, uint256 tokenId) internal {
      require(ownerOf(tokenId) == from, "KIP17: transfer of token that is not own");
      require(to != address(0), "KIP17: transfer to the zero address");

      _clearApproval(tokenId);

      _ownedTokensCount[from].decrement();
      _ownedTokensCount[to].increment();

      _tokenOwner[tokenId] = to;

      emit Transfer(from, to, tokenId);
    }

    /** 
     * 다른 contract로 token을 전송할 때 사용 (Received에 대한 구현 확인)
     * deprecated
     */
    function _checkOnKIP17Received(address from, address to, uint256 tokenId, bytes memory _data) internal returns (bool) {
      bool success; 
      bytes memory returndata;

      if (!to.isContract()) {
        return true;
      }

      (success, returndata) = to.call(abi.encodeWithSelector(_ERC721_RECEIVED, _msgSender(), from, tokenId, _data));
      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _ERC721_RECEIVED) {
        return true;
      }

      (success, returndata) = to.call(abi.encodeWithSelector(_KIP17_RECEIVED, _msgSender(), from, tokenId, _data));
      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _KIP17_RECEIVED) {
        return true;
      }

      return false;
    }

    /** 해당 token의 approvals 초기화 */
    function _clearApproval(uint256 tokenId) private {
        if (_tokenApprovals[tokenId] != address(0)) {
            _tokenApprovals[tokenId] = address(0);
        }
    }
}
