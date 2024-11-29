// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

// This is a file copied from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    function decimals() external view returns (uint8);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}


/**
 * @title Ownable
 * @author DODO Breeder
 *
 * @notice Ownership related functions
 */
contract InitializableOwnable {
    address public _OWNER_;
    address public _NEW_OWNER_;
    bool internal _INITIALIZED_;

    // ============ Events ============

    event OwnershipTransferPrepared(address indexed previousOwner, address indexed newOwner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============

    modifier notInitialized() {
        require(!_INITIALIZED_, "DODO_INITIALIZED");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == _OWNER_, "NOT_OWNER");
        _;
    }

    // ============ Functions ============

    function initOwner(address newOwner) public notInitialized {
        _INITIALIZED_ = true;
        _OWNER_ = newOwner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        emit OwnershipTransferPrepared(_OWNER_, newOwner);
        _NEW_OWNER_ = newOwner;
    }

    function claimOwnership() public {
        require(msg.sender == _NEW_OWNER_, "INVALID_CLAIM");
        emit OwnershipTransferred(_OWNER_, _NEW_OWNER_);
        _OWNER_ = _NEW_OWNER_;
        _NEW_OWNER_ = address(0);
    }
}

/// @title MultiSend - Send multiple tokens to multiple addresses
// WithValid
contract MultisendWithValid is InitializableOwnable {

    address private constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    mapping (address => bool) public AdminList;
    
    struct RefundList {
        address token;
        address target;
        uint256 amount;
        bool isRefund;
    }

    RefundList[] public refundList;

    event Refund(address indexed token, address indexed to, uint256 amount, uint256);

    // ============ Admin Operation Functions ============

    function addAdminList(address admin) public onlyOwner {
        AdminList[admin] = true;
    }

    function removeAdminList(address admin) public onlyOwner {
        AdminList[admin] = false;
    }

    /// @notice used for emergency, generally there wouldn't be tokens left
    function superWithdraw(address token) public onlyOwner {
        if(token != _ETH_ADDRESS_) {
            uint256 restAmount = IERC20(token).balanceOf(address(this));
            (bool success, ) = token.call(abi.encodeWithSignature("transfer(address,uint256)", _OWNER_, restAmount));
            require(success, "MultisendWithValid: TOKEN_TRANSFER_FAILED");
        } else {
            uint256 restAmount = address(this).balance;
            (bool success, ) = payable(_OWNER_).call{value: restAmount}("");
            require(success, "MultisendWithValid: ETH_TRANSFER_FAILED");
        }
    }

    function setRefund(address[] memory token, address[] memory user, uint256[] memory amount) public {
        require(AdminList[msg.sender], "MultisendWithValid: NOT_ADMIN");
        require(token.length == user.length, "MultisendWithValid: LENGTH_NOT_MATCH");
        require(user.length == amount.length, "MultisendWithValid: LENGTH_NOT_MATCH");
        for(uint256 i = 0; i < user.length; i++) {
            refundList.push(RefundList(token[i], user[i], amount[i], false));
        }
    }

    function refund(uint256 startIndex) public onlyOwner returns (uint256 blockNumber, bytes[] memory returnData, bool[] memory dataValid) {
        require(startIndex < refundList.length, "MultisendWithValid: INVALID_INDEX");
        blockNumber = block.number;
        returnData = new bytes[](refundList.length - startIndex);
        dataValid = new bool[](refundList.length - startIndex);
        for(uint256 i = startIndex; i < refundList.length; i++) {
            require(!refundList[i].isRefund, "MultisendWithValid: ALREADY_REFUNDED");

            (bool success, bytes memory ret) = refundList[i].token == _ETH_ADDRESS_ 
                ? payable(refundList[i].target).call{value: refundList[i].amount}("") 
                : refundList[i].token.call(abi.encodeWithSignature("transfer(address,uint256)", refundList[i].target, refundList[i].amount));

            dataValid[i] = success;
            returnData[i] = ret;
            if (success) refundList[i].isRefund = true;

            emit Refund(refundList[i].token, refundList[i].target, refundList[i].amount, i);
        }
    }

    fallback() external payable {}
    receive() external payable {}
}