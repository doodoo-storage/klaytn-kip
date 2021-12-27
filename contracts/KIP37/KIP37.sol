// SPDX-License-Identifier: MIT
pragma solidity ^0.5.6;

import "./IKIP37.sol";
import "./IKIP37MetadataURI.sol";
import "./IKIP37Receiver.sol";
import "./IERC1155Receiver.sol";
import "../utils/Context.sol";
import "../introspection/KIP13.sol";
import "../math/SafeMath.sol";
import "../utils/Address.sol";

contract KIP37 is Context, KIP13, IKIP37, IKIP37MetadataURI {
    using SafeMath for uint256;
    using Address for address;

    /** token에 대한 user wallet address와 balance의 mapping */
    mapping(uint256 => mapping(address => uint256)) private _balances;

    /** user => user의 approval flag mapping */
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /** token id와 해당 token의 총 공급량의 mapping */
    mapping(uint256 => uint256) private _totalSupply;

    // Used as the URI for all token types by relying on ID substition, e.g. https://token-cdn-domain/{id}.json
    string internal _uri;

    /** KIP37 interface의 keccak256 encoded value ^*/
    bytes4 private constant _INTERFACE_ID_KIP37 = 0x6433ca1f;

    /** bytes4(keccak256('uri(uint256)')) == 0x0e89341c */
    bytes4 private constant _INTERFACE_ID_KIP37_METADATA_URI = 0x0e89341c;
    bytes4 private constant _INTERFACE_ID_KIP37_TOKEN_RECEIVER = 0x7cc2d017;
    bytes4 private constant _INTERFACE_ID_ERC1155_TOKEN_RECEIVER = 0x4e2312e0;

    /** 
     * bytes4(keccak256("onKIP37Received(address,address,uint256,uint256,bytes)")) = 0xe78b3325
     * IKIP37Receiver(0).onKIP37Received.selector return value
    */
    bytes4 private constant _KIP37_RECEIVED = 0xe78b3325;

    /** 
     * bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) = 0xf23a6e61
     * IKIP37Receiver(0).onERC1155Received.selector return value
    */
    bytes4 private constant _ERC1155_RECEIVED = 0xf23a6e61;

    /**
     * bytes4(keccak256("onKIP37BatchReceived(address,address,uint256[],uint256[],bytes)")) = 0x9b49e332
     * IKIP37Receiver(0).onKIP37BatchReceived.selector return value
     */
    bytes4 private constant _KIP37_BATCH_RECEIVED = 0x9b49e332;

    /**
     * bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)")) = 0xbc197c81
     * IKIP37Receiver(0).onERC1155BatchReceived.selector return value
     */
    bytes4 private constant _ERC1155_BATCH_RECEIVED = 0xbc197c81;

    /**
     * 해당 token의 uri 설정
     * kip13의 registerInface function을 통해 KIP37 Interface 준수 contract로 등록
     * kip13의 registerInface function을 통해 KIP37MetadataURI Interface 준수 contract로 등록
     */
    constructor(string memory uri) public {
        _setURI(uri);
        _registerInterface(_INTERFACE_ID_KIP37);
        _registerInterface(_INTERFACE_ID_KIP37_METADATA_URI);
    }

    /** 모든 토큰에 대해 동일한 uri를 반환 (이해 필요,,) */
    function uri(uint256) external view returns (string memory) {
        return _uri;
    }

    /** account에 대한 해당 token의 balance 조회 */
    function balanceOf(address account, uint256 id) public view returns (uint256) {
      require(
        account != address(0),
        "KIP37: balance query for the zero address"
      );
      return _balances[id][account];
    }

    /** 
     * accounts의 해당 tokensIds의 balance를 조회 
     * index로 matching되므로 length가 같아야만 한다.
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
      require(accounts.length == ids.length, "KIP37: accounts and ids length mismatch");
      uint256[] memory batchBalances = new uint256[](accounts.length);

      for (uint256 i = 0; i < accounts.length; ++i) {
        require(accounts[i] != address(0), "KIP37: batch balance query for the zero address");
        batchBalances[i] = _balances[ids[i]][accounts[i]];
      }

      return batchBalances;
    }

    /** operator에게 msgSender의 token들에 대한 전송 권한에 대해 설정 */
    function setApprovalForAll(address operator, bool approved) public {
      require(_msgSender() != operator, "KIP37: setting approval status for self");
      
      _operatorApprovals[_msgSender()][operator] = approved;
      emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /** operator의 전송 권한을 확인 */
    function isApprovedForAll(address account, address operator) public view returns (bool) {
      return _operatorApprovals[account][operator];
    }

    /** 해당 tokenId를 가진 토큰의 총 공급량 조회 */
    function totalSupply(uint256 _tokenId) public view returns (uint256) {
      return _totalSupply[_tokenId];
    }

    /**
     * 다른 contract로 token을 전송할 때 사용
     * onKIP37Received를 구현해놓은 contract여야만 전송 가능
     */
    function safeTransferFrom(
        address from, address to,
        uint256 id, uint256 amount, bytes memory data
    ) public {
      require(to != address(0), "KIP37: transfer to the zero address");
      require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "KIP37: caller is not owner nor approved");

      address operator = _msgSender();

      _beforeTokenTransfer(
        operator, from, to,
        _asSingletonArray(id),
        _asSingletonArray(amount), data
      );

      _balances[id][from] = _balances[id][from].sub(amount, "KIP37: insufficient balance for transfer");
      _balances[id][to] = _balances[id][to].add(amount);

      emit TransferSingle(operator, from, to, id, amount);

      require(
        _doSafeTransferAcceptanceCheck(
          operator, from, to,
          id, amount, data
        ),
        "KIP37: transfer to non KIP37Receiver implementer"
      );
    }

    /**
     * 다른 contract로 token들을 전송할 때 사용
     * onKIP37Received를 구현해놓은 contract여야만 전송 가능
     */
    function safeBatchTransferFrom(
      address from, address to, 
      uint256[] memory ids, uint256[] memory amounts, bytes memory data
    ) public {
      require(ids.length == amounts.length, "KIP37: ids and amounts length mismatch");
      require(to != address(0), "KIP37: transfer to the zero address");
      require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "KIP37: transfer caller is not owner nor approved");

      address operator = _msgSender();

      _beforeTokenTransfer(operator, from, to, ids, amounts, data);

      for (uint256 i = 0; i < ids.length; ++i) {
        uint256 id = ids[i];
        uint256 amount = amounts[i];

        _balances[id][from] = _balances[id][from].sub(amount, "KIP37: insufficient balance for transfer");
        _balances[id][to] = _balances[id][to].add(amount);
      }

      emit TransferBatch(operator, from, to, ids, amounts);

      require(
        _doSafeBatchTransferAcceptanceCheck(
          operator, from, to,
          ids, amounts, data
        ),
        "KIP37: batch transfer to non KIP37Receiver implementer"
      );
    }

    function _setURI(string memory newuri) internal {
      _uri = newuri;
    }

    /**
     * 토큰 발행
     * onKIP37Received 구현 필요
     * TransferSingle 이벤트 발생
     */
    function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal {
      require(account != address(0), "KIP37: mint to the zero address");

      address operator = _msgSender();

      _beforeTokenTransfer(
        operator, address(0), account,
        _asSingletonArray(id),
        _asSingletonArray(amount), data
      );

      _balances[id][account] = _balances[id][account].add(amount);
      _totalSupply[id] = _totalSupply[id].add(amount);
      emit TransferSingle(operator, address(0), account, id, amount);

      require(
        _doSafeTransferAcceptanceCheck(
          operator, address(0), account,
          id, amount, data
        ),
        "KIP37: transfer to non KIP37Receiver implementer"
      );
    }

    /**
     * 토큰 일괄 발행
     * ids와 amounts의 length가 동일해야만 함
     * onKIP37BatchReceived 구현 필요
     */
    function _mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal {
      require(to != address(0), "KIP37: mint to the zero address");
      require(ids.length == amounts.length, "KIP37: ids and amounts length mismatch");

      address operator = _msgSender();

      _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);

      for (uint256 i = 0; i < ids.length; i++) {
        _balances[ids[i]][to] = amounts[i].add(_balances[ids[i]][to]);
        _totalSupply[ids[i]] = amounts[i].add(_totalSupply[ids[i]]);
      }

      emit TransferBatch(operator, address(0), to, ids, amounts);

      require(
        _doSafeBatchTransferAcceptanceCheck(
          operator, address(0), to, 
          ids, amounts, data
        ),
        "KIP37: batch transfer to non KIP37Receiver implementer"
      );
    }

    /** 토큰 소각 */
    function _burn(address account, uint256 id, uint256 amount) internal {
      require(account != address(0), "KIP37: burn from the zero address");

      address operator = _msgSender();

      _beforeTokenTransfer(
        operator, account, address(0),
        _asSingletonArray(id),
        _asSingletonArray(amount), ""
      );

      _balances[id][account] = _balances[id][account].sub(amount, "KIP37: burn amount exceeds balance");

      _totalSupply[id] = _totalSupply[id].sub(amount,"KIP37: burn amount exceeds total supply");
      emit TransferSingle(operator, account, address(0), id, amount);
    }

    /** 토큰 일괄소각 */
    function _burnBatch(address account, uint256[] memory ids, uint256[] memory amounts) internal {
      require(account != address(0), "KIP37: burn from the zero address");
      require(ids.length == amounts.length, "KIP37: ids and amounts length mismatch");

      address operator = _msgSender();

      _beforeTokenTransfer(operator, account, address(0), ids, amounts, "");

      for (uint256 i = 0; i < ids.length; i++) {
        _balances[ids[i]][account] = _balances[ids[i]][account].sub(amounts[i], "KIP37: burn amount exceeds balance");
        _totalSupply[ids[i]] = _totalSupply[ids[i]].sub(amounts[i], "KIP37: burn amount exceeds total supply");
      }

      emit TransferBatch(operator, account, address(0), ids, amounts);
    }

    /**
     * 토큰 전송 전 호출되는 함수
     */
    function _beforeTokenTransfer(
      address operator, address from, address to,
      uint256[] memory ids, uint256[] memory amounts, bytes memory data
    ) internal {}
    
    /** safeTransfer에 대한 수락 확인 */
    function _doSafeTransferAcceptanceCheck(
      address operator, address from, address to,
      uint256 id, uint256 amount, bytes memory data
    ) private returns (bool) {
      bool success;
      bytes memory returndata;

      if (!to.isContract()) { return true; }
      (success, returndata) = to.call(
        abi.encodeWithSelector(
          _ERC1155_RECEIVED, operator, from,
          id, amount, data
        )
      );

      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _ERC1155_RECEIVED) {
        return true;
      }

      (success, returndata) = to.call(
        abi.encodeWithSelector(
          _KIP37_RECEIVED, operator, from,
          id, amount, data
        )
      );
      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _KIP37_RECEIVED) {
        return true;
      }

      return false;
    }

    /** safeBatchTransfer에 대한 수락 확인 */
    function _doSafeBatchTransferAcceptanceCheck(
      address operator, address from, address to,
      uint256[] memory ids, uint256[] memory amounts, bytes memory data
    ) private returns (bool) {
      bool success;
      bytes memory returndata;

      if (!to.isContract()) { return true;}

      (success, returndata) = to.call(
        abi.encodeWithSelector(
          _ERC1155_BATCH_RECEIVED, operator, from,
          ids, amounts, data
        )
      );
      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _ERC1155_BATCH_RECEIVED) {
        return true;
      }

      (success, returndata) = to.call(
        abi.encodeWithSelector(
          _KIP37_BATCH_RECEIVED, operator, from,
          ids, amounts, data
        )
      );
      if (returndata.length != 0 && abi.decode(returndata, (bytes4)) == _KIP37_BATCH_RECEIVED) {
        return true;
      }

      return false;
    }

    /** 해당 element를 array로 변환 */
    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
      uint256[] memory array = new uint256[](1);
      array[0] = element;

      return array;
    }
}
