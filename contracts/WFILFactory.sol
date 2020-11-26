/// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.6.12;

/// @title WFILFactory
/// @author Nazzareno Massari @naszam
/// @notice Wrapped Filecoin (WFIL) Factory
/// @dev All function calls are currently implemented without side effects through TDD approach
/// @dev OpenZeppelin library is used for secure contract development

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface WFILToken {
  function wrap(address to, uint256 amount) external returns (bool);
  function unwrap(uint256 amount) external returns (bool);
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract WFILGov is AccessControl, Pausable {

    /// @dev Libraries
    using Counters for Counters.Counter;

    enum RequestStatus {PENDING, CANCELED, APPROVED, REJECTED}

    struct Request {
      address requester; // sender of the request.
      uint256 amount; // amount of fil to mint/burn.
      string deposit; // custodian's fil address in mint, merchant's fil address in burn.
      string cid; // filcoin cid for sending/redeeming fil in the mint/burn process.
      uint256 nonce; // serial number allocated for each request.
      uint256 timestamp; // time of the request creation.
      RequestStatus status; // status of the request.
    }

    /// @dev Contract Owner
    address private _owner;

    WFILToken internal immutable wfil;

    Counters.Counter private _mintsIdTracker;
    Counters.Counter private _burnsIdTracker;

    mapping(address => string) public custodian;
    mapping(address => string) public merchant;
    mapping(bytes32 => uint256) public mintNonce;
    mapping(bytes32 => uint256) public burnNonce;

    mapping(uint256 => Request) public mints;
    mapping(uint256 => Request) public burns;

    /// @dev Library
    using SafeERC20 for IERC20;

    /// @dev Roles
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Events
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event MintRequestAdd(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string deposit,
        string cid,
        uint timestamp,
        bytes32 requestHash
    );
    event MintRequestCancel(uint indexed nonce, address indexed requester, bytes32 requestHash);
    event MintConfirmed(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string deposit,
        string cid,
        uint timestamp,
        bytes32 requestHash
    );

    event MintRejected(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string deposit,
        string cid,
        uint timestamp,
        bytes32 requestHash
    );

    event Burned(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string deposit,
        uint timestamp,
        bytes32 requestHash
    );

    event BurnConfirmed(
        uint indexed nonce,
        address indexed requester,
        uint amount,
        string deposit,
        string cid,
        uint timestamp,
        bytes32 inputRequestHash
    );

    constructor(address wfil_)
        public
    {
        require(wfil_ != address(0), "WFILGov: wfil token set to zero address");
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);

        _owner = msg.sender;

        wfil = WFILToken(wfil_);

    }

    /// @notice Fallback function
    /// @dev Added not payable to revert transactions not matching any other function which send value
    fallback() external {
        revert();
    }

    /// @dev Returns the address of the contract owner
    function owner() public view returns (address) {
        return _owner;
    }


    /// @notice Change the owner address
    /// @param newOwner The address of the new owner
    function setOwner(address newOwner) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        require(newOwner != address(0), "WFILGov: new owner is the zero address");
        emit OwnerChanged(_owner, newOwner);
        _owner = newOwner;
    }

    function addMintRequest(uint256 amount, string calldata cid, string calldata deposit)
        external
        returns (bool)
    {
        require(hasRole(MERCHANT_ROLE, msg.sender), "WFILGov: caller is not a merchant");
        require(!_isEmptyString(deposit), "WFILGov: invalid filecoin deposit address");
        require(_compareStrings(deposit, custodian[msg.sender]), "WFILGov: wrong filecoin deposit address");

        uint256 nonce = _mintsIdTracker.current();
        uint256 timestamp = _timestamp();

        mints[nonce].requester = msg.sender;
        mints[nonce].amount = amount;
        mints[nonce].deposit = deposit;
        mints[nonce].cid = cid;
        mints[nonce].nonce = nonce;
        mints[nonce].timestamp = timestamp;
        mints[nonce].status = RequestStatus.PENDING;

        bytes32 requestHash = _hash(mints[nonce]);
        mintNonce[requestHash] = nonce;
        _mintsIdTracker.increment();

        emit MintRequestAdd(nonce, msg.sender, amount, deposit, cid, timestamp, requestHash);
        return true;
    }

    function cancelMintRequest(bytes32 requestHash) external returns (bool) {
        require(hasRole(MERCHANT_ROLE, msg.sender), "WFILGov: caller is not a merchant");
        uint256 nonce;
        Request memory request;

        (nonce, request) = _getPendingMintRequest(requestHash);

        require(msg.sender == request.requester, "WFILGov: cancel caller is different than pending request initiator");
        mints[nonce].status = RequestStatus.CANCELED;

        emit MintRequestCancel(nonce, msg.sender, requestHash);
        return true;
    }

    function confirmMintRequest(bytes32 requestHash) external returns (bool) {
        require(hasRole(CUSTODIAN_ROLE, msg.sender), "WFILGov: caller is not a custodian");
        uint nonce;
        Request memory request;

        (nonce, request) = _getPendingMintRequest(requestHash);

        mints[nonce].status = RequestStatus.APPROVED;
        require(wfil.wrap(request.requester, request.amount), "WFILGov: mint failed");

        emit MintConfirmed(
            request.nonce,
            request.requester,
            request.amount,
            request.deposit,
            request.cid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    function rejectMintRequest(bytes32 requestHash) external returns (bool) {
        require(hasRole(CUSTODIAN_ROLE, msg.sender), "WFILGov: caller is not a custodian");
        uint nonce;
        Request memory request;

        (nonce, request) = _getPendingMintRequest(requestHash);

        mints[nonce].status = RequestStatus.REJECTED;

        emit MintRejected(
            request.nonce,
            request.requester,
            request.amount,
            request.deposit,
            request.cid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    function burn(uint256 amount) external returns (bool) {
        require(hasRole(MERCHANT_ROLE, msg.sender), "WFILGov: caller is not a merchant");

        string memory deposit = merchant[msg.sender];
        require(!_isEmptyString(deposit), "WFILGov: merchant filecoin deposit address was not set");

        uint256 nonce = _burnsIdTracker.current();
        uint256 timestamp = _timestamp();

        // set txid as empty since it is not known yet.
        string memory cid = "";

        burns[nonce].requester = msg.sender;
        burns[nonce].amount = amount;
        burns[nonce].deposit = deposit;
        burns[nonce].cid = cid;
        burns[nonce].nonce = nonce;
        burns[nonce].timestamp = timestamp;
        burns[nonce].status = RequestStatus.PENDING;

        bytes32 requestHash = _hash(burns[nonce]);
        burnNonce[requestHash] = nonce;
        _burnsIdTracker.increment();

        require(wfil.transferFrom(msg.sender, address(this), amount), "WFILGov: transfer tokens to burn failed");
        require(wfil.unwrap(amount), "WFILGov: burn failed");

        emit Burned(nonce, msg.sender, amount, deposit, timestamp, requestHash);
        return true;
    }

    function confirmBurnRequest(bytes32 requestHash, string calldata cid) external returns (bool) {
        require(hasRole(MERCHANT_ROLE, msg.sender), "WFILGov: caller is not a merchant");
        uint256 nonce;
        Request memory request;

        (nonce, request) = _getPendingBurnRequest(requestHash);

        burns[nonce].cid = cid;
        burns[nonce].status = RequestStatus.APPROVED;
        burnNonce[_hash(burns[nonce])] = nonce;

        emit BurnConfirmed(
            request.nonce,
            request.requester,
            request.amount,
            request.deposit,
            cid,
            request.timestamp,
            requestHash
        );
        return true;
    }

    function getMintRequest(uint256 nonce)
        external
        view
        returns (
            uint256 requestNonce,
            address requester,
            uint256 amount,
            string memory deposit,
            string memory cid,
            uint256 timestamp,
            string memory status,
            bytes32 requestHash
        )
    {
        Request memory request = mints[nonce];
        string memory statusString = _getStatusString(request.status);

        requestNonce = request.nonce;
        requester = request.requester;
        amount = request.amount;
        deposit = request.deposit;
        cid = request.cid;
        timestamp = request.timestamp;
        status = statusString;
        requestHash = _hash(request);
    }

    function getMintRequestsCount() external view returns (uint256 count) {
        return _mintsIdTracker.current();
    }

    function getBurnRequest(uint256 nonce)
        external
        view
        returns (
            uint256 requestNonce,
            address requester,
            uint256 amount,
            string memory deposit,
            string memory cid,
            uint256 timestamp,
            string memory status,
            bytes32 requestHash
        )
    {
        Request storage request = burns[nonce];
        string memory statusString = _getStatusString(request.status);

        requestNonce = request.nonce;
        requester = request.requester;
        amount = request.amount;
        deposit = request.deposit;
        cid = request.cid;
        timestamp = request.timestamp;
        status = statusString;
        requestHash = _hash(request);
    }

    function getBurnRequestsCount() external view returns (uint256 count) {
        return _burnsIdTracker.current();
    }


    /// @notice Reclaim all ERC20 compatible tokens
    /// @dev Access restricted only for Default Admin
    /// @param token IERC20 address of the token contract
    function reclaimToken(IERC20 token) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(_owner, balance);
    }


    /// @notice Add a new Custodian
    /// @dev Access restricted only for Default Admin
    /// @param account Address of the new Custodian
    function addCustodian(address account) external returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        grantRole(CUSTODIAN_ROLE, account);
    }

    /// @notice Remove a Custodian
    /// @dev Access restricted only for Default Admin
    /// @param account Address of the Custodian
    function removeCustodian(address account) external returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        revokeRole(CUSTODIAN_ROLE, account);
    }

    /// @notice Add a new Merchant
    /// @dev Access restricted only for Default Admin
    /// @param account Address of the new Merchant
    function addMerchant(address account) external returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        grantRole(MERCHANT_ROLE, account);
    }

    /// @notice Remove a Merchant
    /// @dev Access restricted only for Default Admin
    /// @param account Address of the Merchant
    function removeMerchant(address account) external returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WFILGov: caller is not the default admin");
        revokeRole(MERCHANT_ROLE, account);
    }

    /// @notice Pause all the functions
    /// @dev the caller must have the 'PAUSER_ROLE'
    function pause() external {
        require(hasRole(PAUSER_ROLE, msg.sender), "WFILGov: must have pauser role to pause");
        _pause();
    }

    /// @notice Unpause all the functions
    /// @dev the caller must have the 'PAUSER_ROLE'
    function unpause() external {
        require(hasRole(PAUSER_ROLE, msg.sender), "WFILGov: must have pauser role to unpause");
        _unpause();
    }

    function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function _isEmptyString(string memory a) internal pure returns (bool) {
       return _compareStrings(a, "");
   }

   function _timestamp() internal view returns (uint256) {
    // timestamp is only used for data maintaining purpose, it is not relied on for critical logic.
    return block.timestamp;
   }

  function _hash(Request memory request) internal pure returns (bytes32) {
      return keccak256(abi.encode(
          request.requester,
          request.amount,
          request.deposit,
          request.cid,
          request.nonce,
          request.timestamp
      ));
  }

  function _getPendingMintRequest(bytes32 requestHash) internal view returns (uint nonce, Request memory request) {
      require(requestHash != 0, "WFILGov: request hash is 0");
      nonce = mintNonce[requestHash];
      request = mints[nonce];
      _check(request, requestHash);
  }

  function _getPendingBurnRequest(bytes32 requestHash) internal view returns (uint nonce, Request memory request) {
      require(requestHash != 0, "WFILGov: request hash is 0");
      nonce = burnNonce[requestHash];
      request = burns[nonce];
      _check(request, requestHash);
  }

  function _check(Request memory request, bytes32 requestHash) internal pure {
      require(request.status == RequestStatus.PENDING, "WFILGov: request is not pending");
      require(requestHash == _hash(request), "WFILGov: given request hash does not match a pending request");
  }

  function _getStatusString(RequestStatus status) internal pure returns (string memory) {
      if (status == RequestStatus.PENDING) return "pending";
      else if (status == RequestStatus.CANCELED) return "canceled";
      else if (status == RequestStatus.APPROVED) return "approved";
      else if (status == RequestStatus.REJECTED) return "rejected";
      else return "unknown";
  }

}
