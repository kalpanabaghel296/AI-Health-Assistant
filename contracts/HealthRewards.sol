// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthRewards
 * @dev On-chain reward and points system for Vital.AI health tracking
 * @notice Compatible with Monad Testnet (EVM-compatible)
 */
contract HealthRewards {
    
    // ============ Constants ============
    
    uint256 public constant DAILY_TASK_POINTS = 10;
    uint256 public constant STREAK_7_DAY_BONUS = 50;
    uint256 public constant STREAK_30_DAY_BONUS = 100;
    uint256 public constant REFERRAL_BONUS = 100;
    uint256 public constant MINIMUM_REDEMPTION = 10000;
    uint256 public constant POINTS_PER_INR_10 = 1000;
    uint256 public constant STREAK_TIMEOUT = 48 hours;
    
    // ============ State Variables ============
    
    address public owner;
    
    struct UserData {
        uint256 totalPoints;
        uint256 currentStreak;
        uint256 lastActivityTimestamp;
        uint256 referralCount;
        address referredBy;
        bool isRegistered;
        mapping(uint256 => bool) dailyTaskCompleted;
    }
    
    mapping(address => UserData) private users;
    mapping(bytes32 => address) private referralCodeToUser;
    
    // ============ Events ============
    
    event UserRegistered(address indexed user, address indexed referrer);
    event PointsAdded(address indexed user, uint256 amount, string reason);
    event StreakUpdated(address indexed user, uint256 newStreak, uint256 bonusPoints);
    event ReferralReward(address indexed referrer, address indexed referee, uint256 points);
    event PointsRedeemed(address indexed user, uint256 pointsRedeemed, uint256 inrEquivalent);
    event StreakReset(address indexed user, uint256 previousStreak);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Registration Functions ============
    
    /**
     * @dev Register a new user without a referral
     */
    function register() external {
        _registerUser(msg.sender, address(0));
    }
    
    /**
     * @dev Register a new user with a referral code
     * @param _referralCode The referral code of the referrer
     */
    function registerWithReferral(bytes32 _referralCode) external {
        address referrer = referralCodeToUser[_referralCode];
        require(referrer != address(0), "Invalid referral code");
        require(referrer != msg.sender, "Cannot refer yourself");
        
        _registerUser(msg.sender, referrer);
        
        // Award referral bonus to referrer
        users[referrer].totalPoints += REFERRAL_BONUS;
        users[referrer].referralCount += 1;
        
        emit ReferralReward(referrer, msg.sender, REFERRAL_BONUS);
        emit PointsAdded(referrer, REFERRAL_BONUS, "Referral bonus");
    }
    
    /**
     * @dev Internal registration logic
     */
    function _registerUser(address _user, address _referrer) internal {
        require(!users[_user].isRegistered, "User already registered");
        
        UserData storage userData = users[_user];
        userData.isRegistered = true;
        userData.referredBy = _referrer;
        userData.lastActivityTimestamp = block.timestamp;
        
        // Generate and store referral code
        bytes32 referralCode = generateReferralCode(_user);
        referralCodeToUser[referralCode] = _user;
        
        emit UserRegistered(_user, _referrer);
    }
    
    // ============ Task & Points Functions ============
    
    /**
     * @dev Complete a daily task and earn points
     * @notice Can only be called once per day
     */
    function completeDailyTask() external onlyRegistered {
        UserData storage user = users[msg.sender];
        uint256 today = _getCurrentDay();
        
        // Prevent double rewards for same day
        require(!user.dailyTaskCompleted[today], "Daily task already completed today");
        
        // Check and update streak
        _updateStreak(msg.sender);
        
        // Mark task as completed for today
        user.dailyTaskCompleted[today] = true;
        user.lastActivityTimestamp = block.timestamp;
        
        // Award daily task points
        user.totalPoints += DAILY_TASK_POINTS;
        emit PointsAdded(msg.sender, DAILY_TASK_POINTS, "Daily task completion");
        
        // Check for streak bonuses
        uint256 bonusPoints = 0;
        
        if (user.currentStreak == 7) {
            bonusPoints = STREAK_7_DAY_BONUS;
            user.totalPoints += bonusPoints;
            emit StreakUpdated(msg.sender, user.currentStreak, bonusPoints);
        } else if (user.currentStreak == 30) {
            bonusPoints = STREAK_30_DAY_BONUS;
            user.totalPoints += bonusPoints;
            emit StreakUpdated(msg.sender, user.currentStreak, bonusPoints);
        } else if (user.currentStreak % 30 == 0 && user.currentStreak > 0) {
            // Bonus every 30 days after the first
            bonusPoints = STREAK_30_DAY_BONUS;
            user.totalPoints += bonusPoints;
            emit StreakUpdated(msg.sender, user.currentStreak, bonusPoints);
        }
    }
    
    /**
     * @dev Update user streak based on last activity
     */
    function _updateStreak(address _user) internal {
        UserData storage user = users[_user];
        uint256 today = _getCurrentDay();
        uint256 lastActiveDay = user.lastActivityTimestamp / 1 days;
        
        if (lastActiveDay == 0) {
            // First activity
            user.currentStreak = 1;
        } else if (today == lastActiveDay + 1) {
            // Consecutive day - increment streak
            user.currentStreak += 1;
        } else if (today > lastActiveDay + 1) {
            // Streak broken - reset
            uint256 previousStreak = user.currentStreak;
            user.currentStreak = 1;
            emit StreakReset(_user, previousStreak);
        }
        // If today == lastActiveDay, don't change streak (same day)
    }
    
    /**
     * @dev Get current day number (days since epoch)
     */
    function _getCurrentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    // ============ Redemption Functions ============
    
    /**
     * @dev Redeem points for rewards (off-chain settlement)
     * @param _points Number of points to redeem
     */
    function redeemPoints(uint256 _points) external onlyRegistered {
        UserData storage user = users[msg.sender];
        
        require(_points >= MINIMUM_REDEMPTION, "Minimum 10,000 points required");
        require(user.totalPoints >= _points, "Insufficient points");
        
        // Calculate INR equivalent (1000 points = 10 INR)
        uint256 inrValue = (_points * 10) / POINTS_PER_INR_10;
        
        // Deduct points
        user.totalPoints -= _points;
        
        // Emit event for off-chain processing
        emit PointsRedeemed(msg.sender, _points, inrValue);
    }
    
    // ============ Referral Functions ============
    
    /**
     * @dev Generate a unique referral code from wallet address
     * @param _user The user's wallet address
     * @return Referral code as bytes32
     */
    function generateReferralCode(address _user) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("VITAL", _user));
    }
    
    /**
     * @dev Get user's referral code
     */
    function getMyReferralCode() external view onlyRegistered returns (bytes32) {
        return generateReferralCode(msg.sender);
    }
    
    /**
     * @dev Check if a referral code is valid
     */
    function isValidReferralCode(bytes32 _code) external view returns (bool) {
        return referralCodeToUser[_code] != address(0);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get user's complete stats
     */
    function getUserStats(address _user) external view returns (
        uint256 totalPoints,
        uint256 currentStreak,
        uint256 lastActivityTimestamp,
        uint256 referralCount,
        address referredBy,
        bool isRegistered
    ) {
        UserData storage user = users[_user];
        return (
            user.totalPoints,
            user.currentStreak,
            user.lastActivityTimestamp,
            user.referralCount,
            user.referredBy,
            user.isRegistered
        );
    }
    
    /**
     * @dev Get user's points balance
     */
    function getPoints(address _user) external view returns (uint256) {
        return users[_user].totalPoints;
    }
    
    /**
     * @dev Get user's current streak
     */
    function getStreak(address _user) external view returns (uint256) {
        return users[_user].currentStreak;
    }
    
    /**
     * @dev Check if user completed today's task
     */
    function hasCompletedTodayTask(address _user) external view returns (bool) {
        return users[_user].dailyTaskCompleted[_getCurrentDay()];
    }
    
    /**
     * @dev Calculate potential redemption value in INR
     */
    function calculateRedemptionValue(uint256 _points) external pure returns (uint256) {
        return (_points * 10) / POINTS_PER_INR_10;
    }
    
    /**
     * @dev Check if user can redeem points
     */
    function canRedeem(address _user) external view returns (bool) {
        return users[_user].totalPoints >= MINIMUM_REDEMPTION;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Award bonus points (admin only, for special events)
     */
    function awardBonusPoints(address _user, uint256 _amount, string calldata _reason) 
        external 
        onlyOwner 
        validAddress(_user) 
    {
        require(users[_user].isRegistered, "User not registered");
        users[_user].totalPoints += _amount;
        emit PointsAdded(_user, _amount, _reason);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        owner = _newOwner;
    }
}
