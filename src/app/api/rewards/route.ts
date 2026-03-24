import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const INCENTIVES_ABI = [
  "function recordReward(address _participant, uint8 _action, uint8 _role, bool _isQualityCheckpoint) external",
  "function getStats(address _participant) external view returns (uint256 totalSTR, uint256 reputationScore, uint256 streakDays, uint256 lastActiveDay, uint256 checkpointCount, uint256 verificationCount, uint256 qualityCheckpoints, uint256 totalCheckpoints, uint256 badgesBitmap, uint256 stakedSTR, uint256 badgeCount)",
  "function getRecentRewards(address _participant, uint256 _limit) external view returns (uint8[] actions, uint256[] amounts, uint256[] multipliers, uint256[] timestamps)",
];

// Action types matching contract enum
const ActionType = {
  Register: 0,
  CreateProduct: 1,
  AddCheckpoint: 2,
  QualityBonus: 3,
  VerifyProduct: 4,
  FlagProduct: 5,
} as const;

function getContract() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api";
  const address = process.env.NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS || "";
  const pk = process.env.HEDERA_PRIVATE_KEY || "";
  if (!address || !pk) return null;
  const connection = {
    url: rpcUrl,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
    skipFetchSetup: true,
  };
  const provider = new ethers.providers.StaticJsonRpcProvider(
    connection,
    { chainId: 296, name: "hedera-testnet" }
  );
  const wallet = new ethers.Wallet(pk, provider);
  return new ethers.Contract(address, INCENTIVES_ABI, wallet);
}

/**
 * POST /api/rewards
 * Body: { participant: string, action: string, role: number, isQualityCheckpoint?: boolean }
 *
 * Records a reward for a participant action on the incentives contract.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant, action, role, isQualityCheckpoint = false } = body;

    if (!participant || action === undefined || role === undefined) {
      return NextResponse.json(
        { error: "participant, action, and role are required" },
        { status: 400 }
      );
    }

    const actionId = ActionType[action as keyof typeof ActionType];
    if (actionId === undefined) {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Valid: ${Object.keys(ActionType).join(", ")}` },
        { status: 400 }
      );
    }

    const contract = getContract();
    if (!contract) {
      // Contract not deployed yet — return mock response for dev
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Incentives contract not configured — reward not recorded on-chain",
      });
    }

    const tx = await contract.recordReward(participant, actionId, role, isQualityCheckpoint);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.transactionHash,
    });
  } catch (error: any) {
    console.error("Reward recording failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record reward" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rewards?address=0x...&limit=20
 * Returns participant stats and recent reward events.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const contract = getContract();
    if (!contract) {
      return NextResponse.json({ stats: null, rewards: [], mock: true });
    }

    const [statsResult, rewardsResult] = await Promise.all([
      contract.getStats(address),
      contract.getRecentRewards(address, limit),
    ]);

    const stats = {
      totalSTR: statsResult.totalSTR.toNumber(),
      reputationScore: statsResult.reputationScore.toNumber(),
      streakDays: statsResult.streakDays.toNumber(),
      lastActiveDay: statsResult.lastActiveDay.toNumber(),
      checkpointCount: statsResult.checkpointCount.toNumber(),
      verificationCount: statsResult.verificationCount.toNumber(),
      qualityRate: statsResult.totalCheckpoints.toNumber() > 0
        ? (statsResult.qualityCheckpoints.toNumber() / statsResult.totalCheckpoints.toNumber()) * 100
        : 0,
      badgesBitmap: statsResult.badgesBitmap.toNumber(),
      stakedSTR: statsResult.stakedSTR.toNumber(),
      badgeCount: statsResult.badgeCount.toNumber(),
    };

    const actionLabels = ["Register", "Create Product", "Add Checkpoint", "Quality Bonus", "Verify Product", "Flag Product"];
    const rewards = [];
    for (let i = 0; i < rewardsResult.actions.length; i++) {
      rewards.push({
        action: actionLabels[rewardsResult.actions[i]] || "Unknown",
        strEarned: rewardsResult.amounts[i].toNumber(),
        multiplier: rewardsResult.multipliers[i].toNumber() / 100,
        timestamp: rewardsResult.timestamps[i].toNumber(),
      });
    }

    return NextResponse.json({ stats, rewards });
  } catch (error: any) {
    console.error("Failed to fetch rewards:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch rewards" }, { status: 500 });
  }
}
