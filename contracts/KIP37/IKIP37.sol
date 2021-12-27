pragma solidity ^0.5.6;

import "../introspection/IKIP13.sol";

contract IKIP37 is IKIP13 {
    /** 해당 id를 가진 token을 operator가 from에서 to에게 value만큼 전송할 때 발생하는 이벤트 */
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    /** 해당 ids를 가진 token들을 operator가 from에서 to에게 values만큼 전송할 때 발생하는 이벤트 */
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );

    /** account가 토큰 전송을 위하여 operator에게 권한을 부여하거나 취소할 떄 발생하는 이벤트 */
    event ApprovalForAll(
        address indexed account,
        address indexed operator,
        bool approved
    );

    /** 해당 id를 가진 토큰의 URI가 value로 변경될 때 발생하는 이벤트 */
    event URI(string value, uint256 indexed id);

    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}
