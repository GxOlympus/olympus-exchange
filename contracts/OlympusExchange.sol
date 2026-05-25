// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Olympus Exchange on Monad
/// @notice Records paid continues, daily check-ins, and scores for the Olympus Exchange game.
contract OlympusExchange {
    address public owner;
    address payable public treasury;
    uint256 public continueFee;

    mapping(address => uint256) public bestScore;
    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public checkInStreak;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event ContinueFeeUpdated(uint256 previousFee, uint256 newFee);
    event ContinuePaid(
        address indexed player,
        uint256 amount,
        uint256 indexed gameId,
        uint256 round,
        uint256 timestamp
    );
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 bestScore,
        string broker,
        uint256 indexed gameId,
        uint256 timestamp
    );
    event DailyCheckIn(address indexed player, uint256 day, uint256 streak, uint256 timestamp);
    event Withdrawal(address indexed treasury, uint256 amount);

    error NotOwner();
    error InvalidAddress();
    error InvalidFee(uint256 expected, uint256 received);
    error AlreadyCheckedIn();
    error NothingToWithdraw();
    error WithdrawalFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address payable initialTreasury, uint256 initialContinueFee) {
        if (initialTreasury == address(0)) revert InvalidAddress();
        owner = msg.sender;
        treasury = initialTreasury;
        continueFee = initialContinueFee;
        emit OwnershipTransferred(address(0), msg.sender);
        emit TreasuryUpdated(address(0), initialTreasury);
        emit ContinueFeeUpdated(0, initialContinueFee);
    }

    receive() external payable {
        _payToContinue(0, 0);
    }

    function payToContinue(uint256 gameId, uint256 round) external payable {
        _payToContinue(gameId, round);
    }

    function submitScore(uint256 score, string calldata broker, uint256 gameId) external {
        uint256 currentBest = bestScore[msg.sender];
        if (score > currentBest) {
            bestScore[msg.sender] = score;
            currentBest = score;
        }

        emit ScoreSubmitted(msg.sender, score, currentBest, broker, gameId, block.timestamp);
    }

    function checkIn() external {
        uint256 today = block.timestamp / 1 days;
        if (lastCheckInDay[msg.sender] == today) revert AlreadyCheckedIn();

        if (lastCheckInDay[msg.sender] + 1 == today) {
            checkInStreak[msg.sender] += 1;
        } else {
            checkInStreak[msg.sender] = 1;
        }

        lastCheckInDay[msg.sender] = today;
        emit DailyCheckIn(msg.sender, today, checkInStreak[msg.sender], block.timestamp);
    }

    function setContinueFee(uint256 newContinueFee) external onlyOwner {
        emit ContinueFeeUpdated(continueFee, newContinueFee);
        continueFee = newContinueFee;
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToWithdraw();

        (bool ok, ) = treasury.call{ value: balance }("");
        if (!ok) revert WithdrawalFailed();

        emit Withdrawal(treasury, balance);
    }

    function _payToContinue(uint256 gameId, uint256 round) internal {
        if (msg.value != continueFee) revert InvalidFee(continueFee, msg.value);
        emit ContinuePaid(msg.sender, msg.value, gameId, round, block.timestamp);
    }
}
