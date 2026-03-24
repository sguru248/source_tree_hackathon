import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";

describe("SourceTraceIncentives", function () {
  let incentives: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let ownerAddr: string;
  let addr1Addr: string;
  let addr2Addr: string;
  let addr3Addr: string;

  // Action types
  const Action = {
    Register: 0,
    CreateProduct: 1,
    AddCheckpoint: 2,
    QualityBonus: 3,
    VerifyProduct: 4,
    FlagProduct: 5,
  };

  // Roles
  const Role = { Farmer: 0, Processor: 1, Distributor: 2, Retailer: 3, Certifier: 4 };

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    addr1Addr = await addr1.getAddress();
    addr2Addr = await addr2.getAddress();
    addr3Addr = await addr3.getAddress();

    const Factory = await ethers.getContractFactory("SourceTraceIncentives");
    incentives = await Factory.deploy();
    await incentives.deployed();
  });

  // ═══════════════════════════════════════════
  // 1. DEPLOYMENT & OWNERSHIP
  // ═══════════════════════════════════════════

  describe("Deployment", function () {
    it("should set deployer as owner", async function () {
      expect(await incentives.owner()).to.equal(ownerAddr);
    });

    it("should start unpaused", async function () {
      expect(await incentives.paused()).to.equal(false);
    });

    it("should start with 0 participants", async function () {
      expect(await incentives.getParticipantCount()).to.equal(0);
    });

    it("should start with 0 reward history", async function () {
      expect(await incentives.getRewardHistoryCount()).to.equal(0);
    });
  });

  // ═══════════════════════════════════════════
  // 2. PAUSABLE
  // ═══════════════════════════════════════════

  describe("Pausable", function () {
    it("should allow owner to pause", async function () {
      await incentives.pause();
      expect(await incentives.paused()).to.equal(true);
    });

    it("should allow owner to unpause", async function () {
      await incentives.pause();
      await incentives.unpause();
      expect(await incentives.paused()).to.equal(false);
    });

    it("should reject non-owner pause", async function () {
      await expect(incentives.connect(addr1).pause()).to.be.revertedWith("Not owner");
    });

    it("should reject recordReward when paused", async function () {
      await incentives.pause();
      await expect(
        incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false)
      ).to.be.revertedWith("Contract is paused");
    });
  });

  // ═══════════════════════════════════════════
  // 3. REWARD RECORDING — BASE REWARDS
  // ═══════════════════════════════════════════

  describe("Base Rewards", function () {
    it("should award 50 STR for Register", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(50);
    });

    it("should award 20 STR for CreateProduct", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.CreateProduct, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(70); // 50 + 20
    });

    it("should award 10 STR for AddCheckpoint", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(60); // 50 + 10
    });

    it("should award 10 + 5 STR for quality checkpoint", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(65); // 50 + 10 + 5
    });

    it("should award 30 STR for VerifyProduct", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(80); // 50 + 30
    });

    it("should award 20 STR for FlagProduct", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.FlagProduct, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.totalSTR).to.equal(70); // 50 + 20
    });

    it("should only allow owner to recordReward", async function () {
      await expect(
        incentives.connect(addr1).recordReward(addr1Addr, Action.Register, Role.Farmer, false)
      ).to.be.revertedWith("Not owner");
    });
  });

  // ═══════════════════════════════════════════
  // 4. PARTICIPANT REGISTRATION
  // ═══════════════════════════════════════════

  describe("Participant Registration", function () {
    it("should register new participant on first recordReward", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      expect(await incentives.getParticipantCount()).to.equal(1);
      expect(await incentives.getParticipantAt(0)).to.equal(addr1Addr);
    });

    it("should store participant role", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Processor, false);
      expect(await incentives.participantRoles(addr1Addr)).to.equal(Role.Processor);
    });

    it("should not double-register same participant", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      expect(await incentives.getParticipantCount()).to.equal(1);
    });

    it("should register multiple participants", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr2Addr, Action.Register, Role.Processor, false);
      await incentives.recordReward(addr3Addr, Action.Register, Role.Retailer, false);
      expect(await incentives.getParticipantCount()).to.equal(3);
    });
  });

  // ═══════════════════════════════════════════
  // 5. STREAK SYSTEM
  // ═══════════════════════════════════════════

  describe("Streak System", function () {
    it("should start streak at 1 on first activity", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.streakDays).to.equal(1);
    });

    it("should not increment streak for same-day actions", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.streakDays).to.equal(1); // all same block = same day
    });

    it("should apply 1.0x multiplier for streak < 3 days", async function () {
      // Same day, no streak multiplier
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      // 50 STR with 1.0x = 50
      expect(stats.totalSTR).to.equal(50);
    });
  });

  // ═══════════════════════════════════════════
  // 6. CHECKPOINT COUNTERS & QUALITY TRACKING
  // ═══════════════════════════════════════════

  describe("Checkpoint & Quality Tracking", function () {
    it("should increment checkpoint count", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.checkpointCount).to.equal(3);
      expect(stats.totalCheckpoints).to.equal(3);
    });

    it("should track quality checkpoints", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.qualityCheckpoints).to.equal(2);
      expect(stats.totalCheckpoints).to.equal(3);
    });

    it("should increment verification count", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.verificationCount).to.equal(2);
    });
  });

  // ═══════════════════════════════════════════
  // 7. REPUTATION SCORE
  // ═══════════════════════════════════════════

  describe("Reputation Score", function () {
    it("should calculate reputation from checkpoints", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      // Add 10 quality checkpoints to get meaningful scores
      for (let i = 0; i < 10; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      }
      const stats = await incentives.getStats(addr1Addr);
      // Checkpoint score: (10/50)*30 = 6
      // Quality score: (10/10)*20 = 20
      // Verify score: 0
      // Streak score: (1/30)*20 = 0 (integer division)
      expect(stats.reputationScore).to.be.gte(20);
    });

    it("should incorporate verification score", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      for (let i = 0; i < 5; i++) {
        await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      }
      const stats = await incentives.getStats(addr1Addr);
      // Verify score: (5/20)*30 = 7
      expect(stats.reputationScore).to.be.gte(7);
    });

    it("should cap reputation at 100", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      // Max out checkpoints
      for (let i = 0; i < 55; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      for (let i = 0; i < 25; i++) {
        await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      }
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.reputationScore).to.be.lte(100);
    });
  });

  // ═══════════════════════════════════════════
  // 8. BADGES
  // ═══════════════════════════════════════════

  describe("Badges", function () {
    it("should unlock FirstCheckpoint badge on first checkpoint", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      let stats = await incentives.getStats(addr1Addr);
      expect(stats.badgesBitmap).to.equal(0);

      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      stats = await incentives.getStats(addr1Addr);
      expect(stats.badgesBitmap.toNumber() & (1 << 0)).to.not.equal(0); // BADGE_FIRST_CHECKPOINT
      expect(stats.badgeCount).to.equal(1);
    });

    it("should unlock TenCheckpoints badge at 10 checkpoints", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      for (let i = 0; i < 10; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      }
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.badgesBitmap.toNumber() & (1 << 1)).to.not.equal(0); // BADGE_TEN_CHECKPOINTS
      expect(stats.badgeCount).to.equal(2); // FirstCheckpoint + TenCheckpoints
    });

    it("should unlock FirstVerification badge", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.badgesBitmap.toNumber() & (1 << 3)).to.not.equal(0); // BADGE_FIRST_VERIFICATION
    });

    it("should not double-count badge unlocks", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.badgeCount).to.equal(1); // Still just FirstCheckpoint
    });

    it("should unlock QualityChampion at 95%+ quality with 10+ checkpoints", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      // 10 quality, 0 non-quality = 100%
      for (let i = 0; i < 10; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      }
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.badgesBitmap.toNumber() & (1 << 8)).to.not.equal(0); // BADGE_QUALITY_CHAMPION
    });
  });

  // ═══════════════════════════════════════════
  // 9. REWARD HISTORY
  // ═══════════════════════════════════════════

  describe("Reward History", function () {
    it("should record reward events", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      expect(await incentives.getRewardHistoryCount()).to.equal(1);
    });

    it("should store correct reward event data", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      const event = await incentives.getRewardEvent(0);
      expect(event.participant).to.equal(addr1Addr);
      expect(event.action).to.equal(Action.Register);
      expect(event.strEarned).to.equal(50);
      expect(event.multiplier).to.equal(100); // 1.0x = 100
    });

    it("should return recent rewards for participant", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      await incentives.recordReward(addr2Addr, Action.Register, Role.Processor, false);

      const result = await incentives.getRecentRewards(addr1Addr, 10);
      expect(result.actions.length).to.equal(2);
      // Most recent first
      expect(result.actions[0]).to.equal(Action.AddCheckpoint);
      expect(result.actions[1]).to.equal(Action.Register);
    });

    it("should respect limit parameter", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);

      const result = await incentives.getRecentRewards(addr1Addr, 2);
      expect(result.actions.length).to.equal(2);
    });
  });

  // ═══════════════════════════════════════════
  // 10. CERTIFIER STAKING
  // ═══════════════════════════════════════════

  describe("Certifier Staking", function () {
    beforeEach(async function () {
      // Give addr1 enough STR as Certifier
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      // Register → 50 STR, need 500 total
      for (let i = 0; i < 30; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      // 50 + 30*(10+5) = 50 + 450 = 500 STR
    });

    it("should allow certifier to stake 500 STR", async function () {
      await incentives.connect(addr1).stake();
      const stats = await incentives.getStats(addr1Addr);
      expect(stats.stakedSTR).to.equal(500);
      expect(stats.totalSTR).to.be.gte(0); // totalSTR reduced by 500
    });

    it("should reject staking from non-certifier", async function () {
      await incentives.recordReward(addr2Addr, Action.Register, Role.Farmer, false);
      // Give Farmer enough STR
      for (let i = 0; i < 30; i++) {
        await incentives.recordReward(addr2Addr, Action.AddCheckpoint, Role.Farmer, true);
      }
      await expect(incentives.connect(addr2).stake()).to.be.revertedWith("Only certifiers can stake");
    });

    it("should reject staking with insufficient balance", async function () {
      // addr3 is certifier but only has 50 STR
      await incentives.recordReward(addr3Addr, Action.Register, Role.Certifier, false);
      await expect(incentives.connect(addr3).stake()).to.be.revertedWith("Insufficient STR balance");
    });

    it("should reject double staking", async function () {
      await incentives.connect(addr1).stake();
      // Give more STR
      for (let i = 0; i < 34; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      await expect(incentives.connect(addr1).stake()).to.be.revertedWith("Already staked");
    });

    it("should allow owner to slash staked certifier", async function () {
      await incentives.connect(addr1).stake();
      const beforeStats = await incentives.getStats(addr1Addr);
      const beforeStake = beforeStats.stakedSTR.toNumber();
      const beforeRep = beforeStats.reputationScore.toNumber();

      await incentives.slash(addr1Addr);
      const afterStats = await incentives.getStats(addr1Addr);
      expect(afterStats.stakedSTR).to.equal(beforeStake - 100);
      expect(afterStats.reputationScore).to.be.lt(beforeRep);
    });

    it("should reject slash on non-staked participant", async function () {
      await expect(incentives.slash(addr2Addr)).to.be.revertedWith("Not staked");
    });

    it("should reject slash from non-owner", async function () {
      await incentives.connect(addr1).stake();
      await expect(incentives.connect(addr2).slash(addr1Addr)).to.be.revertedWith("Not owner");
    });
  });

  // ═══════════════════════════════════════════
  // 11. LEADERBOARD
  // ═══════════════════════════════════════════

  describe("Leaderboard", function () {
    beforeEach(async function () {
      // Register 3 farmers with different activity levels
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr2Addr, Action.Register, Role.Farmer, false);
      await incentives.recordReward(addr3Addr, Action.Register, Role.Farmer, false);

      // addr1: 5 checkpoints
      for (let i = 0; i < 5; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      }
      // addr2: 10 checkpoints
      for (let i = 0; i < 10; i++) {
        await incentives.recordReward(addr2Addr, Action.AddCheckpoint, Role.Farmer, true);
      }
      // addr3: 2 checkpoints
      for (let i = 0; i < 2; i++) {
        await incentives.recordReward(addr3Addr, Action.AddCheckpoint, Role.Farmer, false);
      }
    });

    it("should return leaderboard sorted by reputation", async function () {
      const result = await incentives.getLeaderboard(Role.Farmer, 10);
      expect(result.addresses.length).to.equal(3);
      // addr2 has highest reputation (most checkpoints, all quality)
      expect(result.addresses[0]).to.equal(addr2Addr);
      expect(result.reputations[0]).to.be.gte(result.reputations[1]);
      expect(result.reputations[1]).to.be.gte(result.reputations[2]);
    });

    it("should respect limit parameter", async function () {
      const result = await incentives.getLeaderboard(Role.Farmer, 2);
      expect(result.addresses.length).to.equal(2);
    });

    it("should filter by role", async function () {
      // Register a processor
      await incentives.recordReward(ownerAddr, Action.Register, Role.Processor, false);
      const farmerBoard = await incentives.getLeaderboard(Role.Farmer, 10);
      const processorBoard = await incentives.getLeaderboard(Role.Processor, 10);
      expect(farmerBoard.addresses.length).to.equal(3);
      expect(processorBoard.addresses.length).to.equal(1);
    });

    it("should return empty for role with no participants", async function () {
      const result = await incentives.getLeaderboard(Role.Retailer, 10);
      expect(result.addresses.length).to.equal(0);
    });

    it("should include correct stats per entry", async function () {
      const result = await incentives.getLeaderboard(Role.Farmer, 10);
      // addr2 is first (10 checkpoints)
      expect(result.cpCounts[0]).to.equal(10);
      expect(result.strBalances[0]).to.be.gte(100);
    });
  });

  // ═══════════════════════════════════════════
  // 12. EVENTS
  // ═══════════════════════════════════════════

  describe("Events", function () {
    it("should emit RewardIssued event", async function () {
      await expect(incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false))
        .to.emit(incentives, "RewardIssued")
        .withArgs(addr1Addr, Action.Register, 50, 100);
    });

    it("should emit StreakUpdated event", async function () {
      await expect(incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false))
        .to.emit(incentives, "StreakUpdated")
        .withArgs(addr1Addr, 1);
    });

    it("should emit ReputationUpdated event", async function () {
      await expect(incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false))
        .to.emit(incentives, "ReputationUpdated");
    });

    it("should emit BadgeUnlocked event on badge unlock", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      await expect(incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false))
        .to.emit(incentives, "BadgeUnlocked")
        .withArgs(addr1Addr, 0); // BADGE_FIRST_CHECKPOINT
    });

    it("should emit Staked event", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      for (let i = 0; i < 30; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      await expect(incentives.connect(addr1).stake())
        .to.emit(incentives, "Staked")
        .withArgs(addr1Addr, 500);
    });

    it("should emit Slashed event", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      for (let i = 0; i < 30; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      await incentives.connect(addr1).stake();
      await expect(incentives.slash(addr1Addr))
        .to.emit(incentives, "Slashed")
        .withArgs(addr1Addr, 100);
    });
  });

  // ═══════════════════════════════════════════
  // 13. CUMULATIVE / INTEGRATION SCENARIOS
  // ═══════════════════════════════════════════

  describe("Integration Scenarios", function () {
    it("Scenario: Full farmer journey — register, create, 3 checkpoints, verify", async function () {
      // Register as Farmer
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);

      // Create product
      await incentives.recordReward(addr1Addr, Action.CreateProduct, Role.Farmer, false);

      // 3 checkpoints (2 quality, 1 not)
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, false);

      const stats = await incentives.getStats(addr1Addr);
      // Total: 50 + 20 + 15 + 15 + 10 = 110
      expect(stats.totalSTR).to.equal(110);
      expect(stats.checkpointCount).to.equal(3);
      expect(stats.qualityCheckpoints).to.equal(2);
      expect(stats.badgeCount).to.equal(1); // FirstCheckpoint
      expect(stats.reputationScore).to.be.gte(1); // some reputation from activity
    });

    it("Scenario: Multi-role supply chain with leaderboard comparison", async function () {
      // Farmer (addr1): heavy checkpoint activity
      await incentives.recordReward(addr1Addr, Action.Register, Role.Farmer, false);
      for (let i = 0; i < 15; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Farmer, true);
      }

      // Certifier (addr2): verification focused
      await incentives.recordReward(addr2Addr, Action.Register, Role.Certifier, false);
      for (let i = 0; i < 10; i++) {
        await incentives.recordReward(addr2Addr, Action.VerifyProduct, Role.Certifier, false);
      }

      // Farmer leaderboard should only have addr1
      const farmerBoard = await incentives.getLeaderboard(Role.Farmer, 10);
      expect(farmerBoard.addresses.length).to.equal(1);
      expect(farmerBoard.addresses[0]).to.equal(addr1Addr);

      // Certifier leaderboard should only have addr2
      const certBoard = await incentives.getLeaderboard(Role.Certifier, 10);
      expect(certBoard.addresses.length).to.equal(1);
      expect(certBoard.addresses[0]).to.equal(addr2Addr);
    });

    it("Scenario: Badge progression from 0 to multiple badges", async function () {
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);

      // No badges yet
      let stats = await incentives.getStats(addr1Addr);
      expect(stats.badgeCount).to.equal(0);

      // 1 checkpoint → FirstCheckpoint badge
      await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      stats = await incentives.getStats(addr1Addr);
      expect(stats.badgeCount).to.equal(1);

      // 1 verification → FirstVerification badge
      await incentives.recordReward(addr1Addr, Action.VerifyProduct, Role.Certifier, false);
      stats = await incentives.getStats(addr1Addr);
      expect(stats.badgeCount).to.equal(2);

      // 9 more checkpoints → TenCheckpoints badge
      for (let i = 0; i < 9; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }
      stats = await incentives.getStats(addr1Addr);
      expect(stats.badgeCount).to.equal(4); // FirstCP + TenCP + FirstVerify + QualityChampion (10/10 = 100%)
    });

    it("Scenario: Certifier stake → slash → reduced reputation and stake", async function () {
      // Build up 500+ STR
      await incentives.recordReward(addr1Addr, Action.Register, Role.Certifier, false);
      for (let i = 0; i < 30; i++) {
        await incentives.recordReward(addr1Addr, Action.AddCheckpoint, Role.Certifier, true);
      }

      // Stake
      await incentives.connect(addr1).stake();
      let stats = await incentives.getStats(addr1Addr);
      expect(stats.stakedSTR).to.equal(500);
      const repBeforeSlash = stats.reputationScore.toNumber();

      // Slash
      await incentives.slash(addr1Addr);
      stats = await incentives.getStats(addr1Addr);
      expect(stats.stakedSTR).to.equal(400); // 500 - 100
      expect(stats.reputationScore).to.be.lt(repBeforeSlash); // reputation penalized
    });
  });
});
