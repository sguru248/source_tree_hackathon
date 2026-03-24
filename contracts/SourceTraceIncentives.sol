// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SourceTraceIncentives
 * @notice Manages reputation scores, streaks, badges, reward tracking, and certifier staking.
 *         STR token transfers happen off-chain via HTS; this contract tracks balances/state.
 */
contract SourceTraceIncentives {
    // ─── Enums ───

    enum ActionType { Register, CreateProduct, AddCheckpoint, QualityBonus, VerifyProduct, FlagProduct }

    // ─── Structs ───

    struct ParticipantStats {
        uint256 totalSTR;
        uint256 reputationScore;      // 0-100
        uint256 streakDays;
        uint256 lastActiveDay;        // day number (timestamp / 86400)
        uint256 checkpointCount;
        uint256 verificationCount;
        uint256 qualityCheckpoints;   // checkpoints with temp in range
        uint256 totalCheckpoints;     // for quality rate calculation
        uint256 badgesBitmap;         // bit flags for 9 badges
        uint256 stakedSTR;            // certifier staking
        uint256 lastReputationUpdate; // timestamp of last reputation calc
        uint256 badgeCount;           // number of badges unlocked
        bool isRegistered;
    }

    struct RewardEvent {
        address participant;
        ActionType action;
        uint256 strEarned;
        uint256 multiplier;  // scaled by 100 (e.g., 150 = 1.5x)
        uint256 timestamp;
    }

    // ─── Constants ───

    uint256 public constant STR_REGISTER = 50;
    uint256 public constant STR_CREATE_PRODUCT = 20;
    uint256 public constant STR_ADD_CHECKPOINT = 10;
    uint256 public constant STR_QUALITY_BONUS = 5;
    uint256 public constant STR_VERIFY_PRODUCT = 30;
    uint256 public constant STR_FLAG_PRODUCT = 20;

    uint256 public constant STAKE_AMOUNT = 500;
    uint256 public constant SLASH_AMOUNT = 100;

    uint256 public constant REPUTATION_DECAY_PER_WEEK = 1;
    uint256 public constant MAX_REPUTATION = 100;

    // Badge IDs (bit positions)
    uint256 public constant BADGE_FIRST_CHECKPOINT = 0;
    uint256 public constant BADGE_TEN_CHECKPOINTS = 1;
    uint256 public constant BADGE_FIFTY_CHECKPOINTS = 2;
    uint256 public constant BADGE_FIRST_VERIFICATION = 3;
    uint256 public constant BADGE_TEN_VERIFICATIONS = 4;
    uint256 public constant BADGE_WEEK_STREAK = 5;
    uint256 public constant BADGE_MONTH_STREAK = 6;
    uint256 public constant BADGE_TOP_REPUTATION = 7;
    uint256 public constant BADGE_QUALITY_CHAMPION = 8;

    // ─── State ───

    address public owner;
    bool public paused;

    mapping(address => ParticipantStats) public stats;
    address[] public allParticipants;
    RewardEvent[] public rewardHistory;

    // Role tracking (mirrors SupplyChain roles for leaderboard filtering)
    mapping(address => uint8) public participantRoles; // 0=Farmer, 1=Processor, 2=Distributor, 3=Retailer, 4=Certifier

    // ─── Events ───

    event RewardIssued(address indexed participant, ActionType action, uint256 strEarned, uint256 multiplier);
    event ReputationUpdated(address indexed participant, uint256 newScore);
    event StreakUpdated(address indexed participant, uint256 streakDays);
    event BadgeUnlocked(address indexed participant, uint256 badgeId);
    event Staked(address indexed participant, uint256 amount);
    event Slashed(address indexed participant, uint256 amount);

    // ─── Constructor ───

    constructor() {
        owner = msg.sender;
    }

    // ─── Modifiers ───

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ─── Admin ───

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }

    // ─── Core: Record Reward ───

    /**
     * @notice Records a reward for a participant action. Called by server after successful SupplyChain tx.
     * @param _participant The address of the participant
     * @param _action The type of action performed
     * @param _role The participant's role (for leaderboard)
     * @param _isQualityCheckpoint Whether temperature was in acceptable range (for checkpoints)
     */
    function recordReward(
        address _participant,
        ActionType _action,
        uint8 _role,
        bool _isQualityCheckpoint
    ) external onlyOwner whenNotPaused {
        ParticipantStats storage s = stats[_participant];

        // First time registration
        if (!s.isRegistered) {
            s.isRegistered = true;
            allParticipants.push(_participant);
            participantRoles[_participant] = _role;
        }

        // Update streak
        uint256 today = block.timestamp / 86400;
        if (s.lastActiveDay == 0) {
            s.streakDays = 1;
        } else if (today == s.lastActiveDay + 1) {
            s.streakDays++;
        } else if (today > s.lastActiveDay + 1) {
            s.streakDays = 1; // streak broken
        }
        // Same day: no streak change
        s.lastActiveDay = today;
        emit StreakUpdated(_participant, s.streakDays);

        // Calculate multiplier (scaled by 100)
        uint256 multiplier = 100;
        if (s.streakDays >= 30) multiplier = 200;
        else if (s.streakDays >= 7) multiplier = 150;
        else if (s.streakDays >= 3) multiplier = 120;

        // Calculate base reward
        uint256 baseReward = _getBaseReward(_action);
        uint256 reward = (baseReward * multiplier) / 100;

        // Quality bonus for checkpoints
        if (_action == ActionType.AddCheckpoint) {
            s.totalCheckpoints++;
            if (_isQualityCheckpoint) {
                s.qualityCheckpoints++;
                reward += (STR_QUALITY_BONUS * multiplier) / 100;
            }
            s.checkpointCount++;
        }

        if (_action == ActionType.VerifyProduct) {
            s.verificationCount++;
        }

        // Apply reward
        s.totalSTR += reward;

        // Record event
        rewardHistory.push(RewardEvent({
            participant: _participant,
            action: _action,
            strEarned: reward,
            multiplier: multiplier,
            timestamp: block.timestamp
        }));

        emit RewardIssued(_participant, _action, reward, multiplier);

        // Check and award badges
        _checkBadges(_participant);

        // Update reputation
        _updateReputation(_participant);
    }

    // ─── Reputation ───

    function _updateReputation(address _participant) internal {
        ParticipantStats storage s = stats[_participant];

        // Weighted score: Checkpoints (30%) + Quality rate (20%) + Verifications (30%) + Streak (20%)
        uint256 cpScore = s.checkpointCount > 50 ? 30 : (s.checkpointCount * 30) / 50;

        uint256 qualityScore = 0;
        if (s.totalCheckpoints > 0) {
            qualityScore = (s.qualityCheckpoints * 20) / s.totalCheckpoints;
        }

        uint256 verifyScore = s.verificationCount > 20 ? 30 : (s.verificationCount * 30) / 20;

        uint256 streakScore = s.streakDays > 30 ? 20 : (s.streakDays * 20) / 30;

        uint256 newScore = cpScore + qualityScore + verifyScore + streakScore;

        // Apply decay: -1 per inactive week
        uint256 weeksSinceLastUpdate = 0;
        if (s.lastReputationUpdate > 0) {
            weeksSinceLastUpdate = (block.timestamp - s.lastReputationUpdate) / (7 days);
        }
        if (weeksSinceLastUpdate > 0 && newScore > weeksSinceLastUpdate * REPUTATION_DECAY_PER_WEEK) {
            newScore -= weeksSinceLastUpdate * REPUTATION_DECAY_PER_WEEK;
        }

        if (newScore > MAX_REPUTATION) newScore = MAX_REPUTATION;

        s.reputationScore = newScore;
        s.lastReputationUpdate = block.timestamp;

        emit ReputationUpdated(_participant, newScore);
    }

    // ─── Badges ───

    function _checkBadges(address _participant) internal {
        ParticipantStats storage s = stats[_participant];

        _tryUnlockBadge(s, _participant, BADGE_FIRST_CHECKPOINT, s.checkpointCount >= 1);
        _tryUnlockBadge(s, _participant, BADGE_TEN_CHECKPOINTS, s.checkpointCount >= 10);
        _tryUnlockBadge(s, _participant, BADGE_FIFTY_CHECKPOINTS, s.checkpointCount >= 50);
        _tryUnlockBadge(s, _participant, BADGE_FIRST_VERIFICATION, s.verificationCount >= 1);
        _tryUnlockBadge(s, _participant, BADGE_TEN_VERIFICATIONS, s.verificationCount >= 10);
        _tryUnlockBadge(s, _participant, BADGE_WEEK_STREAK, s.streakDays >= 7);
        _tryUnlockBadge(s, _participant, BADGE_MONTH_STREAK, s.streakDays >= 30);
        _tryUnlockBadge(s, _participant, BADGE_TOP_REPUTATION, s.reputationScore >= 80);

        if (s.totalCheckpoints >= 10) {
            uint256 qualityPercent = (s.qualityCheckpoints * 100) / s.totalCheckpoints;
            _tryUnlockBadge(s, _participant, BADGE_QUALITY_CHAMPION, qualityPercent >= 95);
        }
    }

    function _tryUnlockBadge(ParticipantStats storage s, address _participant, uint256 _badgeId, bool _condition) internal {
        if (_condition && (s.badgesBitmap & (1 << _badgeId)) == 0) {
            s.badgesBitmap |= (1 << _badgeId);
            s.badgeCount++;
            emit BadgeUnlocked(_participant, _badgeId);
        }
    }

    // ─── Staking (Certifiers) ───

    function stake() external whenNotPaused {
        ParticipantStats storage s = stats[msg.sender];
        require(s.isRegistered, "Not registered");
        require(participantRoles[msg.sender] == 4, "Only certifiers can stake");
        require(s.totalSTR >= STAKE_AMOUNT, "Insufficient STR balance");
        require(s.stakedSTR == 0, "Already staked");

        s.totalSTR -= STAKE_AMOUNT;
        s.stakedSTR = STAKE_AMOUNT;

        emit Staked(msg.sender, STAKE_AMOUNT);
    }

    function slash(address _certifier) external onlyOwner whenNotPaused {
        ParticipantStats storage s = stats[_certifier];
        require(s.stakedSTR > 0, "Not staked");

        uint256 slashAmt = s.stakedSTR >= SLASH_AMOUNT ? SLASH_AMOUNT : s.stakedSTR;
        s.stakedSTR -= slashAmt;

        // Reputation penalty
        if (s.reputationScore > 10) {
            s.reputationScore -= 10;
        } else {
            s.reputationScore = 0;
        }

        emit Slashed(_certifier, slashAmt);
        emit ReputationUpdated(_certifier, s.reputationScore);
    }

    // ─── View Functions ───

    function _getBaseReward(ActionType _action) internal pure returns (uint256) {
        if (_action == ActionType.Register) return STR_REGISTER;
        if (_action == ActionType.CreateProduct) return STR_CREATE_PRODUCT;
        if (_action == ActionType.AddCheckpoint) return STR_ADD_CHECKPOINT;
        if (_action == ActionType.VerifyProduct) return STR_VERIFY_PRODUCT;
        if (_action == ActionType.FlagProduct) return STR_FLAG_PRODUCT;
        return 0;
    }

    function getStats(address _participant) external view returns (
        uint256 totalSTR,
        uint256 reputationScore,
        uint256 streakDays,
        uint256 lastActiveDay,
        uint256 checkpointCount,
        uint256 verificationCount,
        uint256 qualityCheckpoints,
        uint256 totalCheckpoints,
        uint256 badgesBitmap,
        uint256 stakedSTR,
        uint256 badgeCount
    ) {
        ParticipantStats storage s = stats[_participant];
        return (
            s.totalSTR,
            s.reputationScore,
            s.streakDays,
            s.lastActiveDay,
            s.checkpointCount,
            s.verificationCount,
            s.qualityCheckpoints,
            s.totalCheckpoints,
            s.badgesBitmap,
            s.stakedSTR,
            s.badgeCount
        );
    }

    function getParticipantCount() external view returns (uint256) {
        return allParticipants.length;
    }

    function getParticipantAt(uint256 _index) external view returns (address) {
        return allParticipants[_index];
    }

    function getRewardHistoryCount() external view returns (uint256) {
        return rewardHistory.length;
    }

    function getRewardEvent(uint256 _index) external view returns (
        address participant,
        ActionType action,
        uint256 strEarned,
        uint256 multiplier,
        uint256 timestamp
    ) {
        RewardEvent storage e = rewardHistory[_index];
        return (e.participant, e.action, e.strEarned, e.multiplier, e.timestamp);
    }

    /**
     * @notice Get recent reward events for a participant (last N events)
     * @param _participant Address to query
     * @param _limit Max events to return
     */
    function getRecentRewards(address _participant, uint256 _limit) external view returns (
        ActionType[] memory actions,
        uint256[] memory amounts,
        uint256[] memory multipliers,
        uint256[] memory timestamps
    ) {
        // Count matching events first
        uint256 count = 0;
        uint256 len = rewardHistory.length;
        for (uint256 i = len; i > 0 && count < _limit; i--) {
            if (rewardHistory[i - 1].participant == _participant) {
                count++;
            }
        }

        actions = new ActionType[](count);
        amounts = new uint256[](count);
        multipliers = new uint256[](count);
        timestamps = new uint256[](count);

        uint256 idx = 0;
        for (uint256 i = len; i > 0 && idx < count; i--) {
            if (rewardHistory[i - 1].participant == _participant) {
                actions[idx] = rewardHistory[i - 1].action;
                amounts[idx] = rewardHistory[i - 1].strEarned;
                multipliers[idx] = rewardHistory[i - 1].multiplier;
                timestamps[idx] = rewardHistory[i - 1].timestamp;
                idx++;
            }
        }
    }

    // Leaderboard: get top N by reputation for a given role
    function getLeaderboard(uint8 _role, uint256 _limit) external view returns (
        address[] memory addresses,
        uint256[] memory reputations,
        uint256[] memory strBalances,
        uint256[] memory streaks,
        uint256[] memory cpCounts,
        uint256[] memory verifyCounts
    ) {
        // Collect addresses for role
        uint256 total = allParticipants.length;
        address[] memory candidates = new address[](total);
        uint256 candidateCount = 0;

        for (uint256 i = 0; i < total; i++) {
            if (participantRoles[allParticipants[i]] == _role && stats[allParticipants[i]].isRegistered) {
                candidates[candidateCount] = allParticipants[i];
                candidateCount++;
            }
        }

        // Simple selection sort for top _limit by reputation (gas-acceptable for testnet)
        uint256 resultCount = candidateCount < _limit ? candidateCount : _limit;
        addresses = new address[](resultCount);
        reputations = new uint256[](resultCount);
        strBalances = new uint256[](resultCount);
        streaks = new uint256[](resultCount);
        cpCounts = new uint256[](resultCount);
        verifyCounts = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < candidateCount; j++) {
                if (stats[candidates[j]].reputationScore > stats[candidates[maxIdx]].reputationScore) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (candidates[i], candidates[maxIdx]) = (candidates[maxIdx], candidates[i]);
            }

            address addr = candidates[i];
            addresses[i] = addr;
            reputations[i] = stats[addr].reputationScore;
            strBalances[i] = stats[addr].totalSTR;
            streaks[i] = stats[addr].streakDays;
            cpCounts[i] = stats[addr].checkpointCount;
            verifyCounts[i] = stats[addr].verificationCount;
        }
    }
}
