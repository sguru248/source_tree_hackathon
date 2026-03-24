import { ethers } from "ethers";
import {
  ParticipantStats, RewardEvent, LeaderboardEntry, Badge,
  BADGE_DEFINITIONS, BadgeId, getStreakMultiplier,
} from "@/types";
import { getEthereumProvider } from "@/lib/ethereum";

const INCENTIVES_ABI = [
  "function getStats(address _participant) external view returns (uint256 totalSTR, uint256 reputationScore, uint256 streakDays, uint256 lastActiveDay, uint256 checkpointCount, uint256 verificationCount, uint256 qualityCheckpoints, uint256 totalCheckpoints, uint256 badgesBitmap, uint256 stakedSTR, uint256 badgeCount)",
  "function getRecentRewards(address _participant, uint256 _limit) external view returns (uint8[] actions, uint256[] amounts, uint256[] multipliers, uint256[] timestamps)",
  "function getLeaderboard(uint8 _role, uint256 _limit) external view returns (address[] addresses, uint256[] reputations, uint256[] strBalances, uint256[] streaks, uint256[] cpCounts, uint256[] verifyCounts)",
  "function getParticipantCount() external view returns (uint256)",
  "function getRewardHistoryCount() external view returns (uint256)",
  "function participantRoles(address) external view returns (uint8)",
  "function stake() external",
];

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api";
const INCENTIVES_ADDRESS = process.env.NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS || "";

const ACTION_LABELS = ["Register", "Create Product", "Add Checkpoint", "Quality Bonus", "Verify Product", "Flag Product"];

function getIncentivesProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(RPC_URL);
}

function getReadContract(): ethers.Contract {
  const provider = getIncentivesProvider();
  return new ethers.Contract(INCENTIVES_ADDRESS, INCENTIVES_ABI, provider);
}

export async function getWriteIncentivesContract(): Promise<ethers.Contract> {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error("MetaMask not found");
  }
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(INCENTIVES_ADDRESS, INCENTIVES_ABI, signer);
}

export async function fetchParticipantStats(address: string): Promise<ParticipantStats | null> {
  if (!INCENTIVES_ADDRESS) return null;
  try {
    const contract = getReadContract();
    const s = await contract.getStats(address);
    const streakDays = s.streakDays.toNumber();
    return {
      address,
      totalSTR: s.totalSTR.toNumber(),
      reputationScore: s.reputationScore.toNumber(),
      streakDays,
      streakMultiplier: getStreakMultiplier(streakDays),
      lastActiveTimestamp: s.lastActiveDay.toNumber() * 86400,
      checkpointCount: s.checkpointCount.toNumber(),
      verificationCount: s.verificationCount.toNumber(),
      qualityRate: s.totalCheckpoints.toNumber() > 0
        ? (s.qualityCheckpoints.toNumber() / s.totalCheckpoints.toNumber()) * 100
        : 0,
      badgeCount: s.badgeCount.toNumber(),
    };
  } catch (err) {
    console.warn("Failed to fetch participant stats:", err);
    return null;
  }
}

export function decodeBadges(badgesBitmap: number): Badge[] {
  return BADGE_DEFINITIONS.map(badge => ({
    ...badge,
    unlocked: (badgesBitmap & (1 << badge.id)) !== 0,
  }));
}

export async function fetchBadges(address: string): Promise<Badge[]> {
  if (!INCENTIVES_ADDRESS) return BADGE_DEFINITIONS.map(b => ({ ...b, unlocked: false }));
  try {
    const contract = getReadContract();
    const s = await contract.getStats(address);
    return decodeBadges(s.badgesBitmap.toNumber());
  } catch {
    return BADGE_DEFINITIONS.map(b => ({ ...b, unlocked: false }));
  }
}

export async function fetchRecentRewards(address: string, limit: number = 20): Promise<RewardEvent[]> {
  if (!INCENTIVES_ADDRESS) return [];
  try {
    const contract = getReadContract();
    const result = await contract.getRecentRewards(address, limit);
    const events: RewardEvent[] = [];
    for (let i = 0; i < result.actions.length; i++) {
      events.push({
        id: `${address}-${result.timestamps[i].toNumber()}-${i}`,
        action: ACTION_LABELS[result.actions[i]] || "Unknown",
        strEarned: result.amounts[i].toNumber(),
        multiplier: result.multipliers[i].toNumber() / 100,
        timestamp: result.timestamps[i].toNumber(),
      });
    }
    return events;
  } catch (err) {
    console.warn("Failed to fetch recent rewards:", err);
    return [];
  }
}

export async function fetchLeaderboard(role: number, limit: number = 20): Promise<LeaderboardEntry[]> {
  if (!INCENTIVES_ADDRESS) return [];
  try {
    const contract = getReadContract();
    const result = await contract.getLeaderboard(role, limit);
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < result.addresses.length; i++) {
      entries.push({
        rank: i + 1,
        address: result.addresses[i],
        name: "", // Will be enriched by caller from SupplyChain contract
        role,
        location: "",
        reputationScore: result.reputations[i].toNumber(),
        totalSTR: result.strBalances[i].toNumber(),
        streakDays: result.streaks[i].toNumber(),
        checkpointCount: result.cpCounts[i].toNumber(),
        verificationCount: result.verifyCounts[i].toNumber(),
      });
    }
    return entries;
  } catch (err) {
    console.warn("Failed to fetch leaderboard:", err);
    return [];
  }
}

export async function stakeSTR(): Promise<ethers.ContractTransaction> {
  const contract = await getWriteIncentivesContract();
  return contract.stake();
}
