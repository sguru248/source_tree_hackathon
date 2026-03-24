import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const INCENTIVES_ABI = [
  "function getLeaderboard(uint8 _role, uint256 _limit) external view returns (address[] addresses, uint256[] reputations, uint256[] strBalances, uint256[] streaks, uint256[] cpCounts, uint256[] verifyCounts)",
];

const SUPPLY_CHAIN_ABI = [
  "function participants(address) external view returns (string name, uint8 role, string location, bool isRegistered)",
];

/**
 * GET /api/leaderboard?role=0&limit=20
 * Returns leaderboard entries enriched with participant names from SupplyChain contract.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = parseInt(searchParams.get("role") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (role < 0 || role > 4) {
      return NextResponse.json({ error: "role must be 0-4" }, { status: 400 });
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api";
    const incentivesAddress = process.env.NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS || "";
    const supplyChainAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

    if (!incentivesAddress) {
      return NextResponse.json({ entries: [], mock: true });
    }

    const provider = new ethers.providers.StaticJsonRpcProvider(
      { url: rpcUrl, timeout: 30000, headers: { "Content-Type": "application/json" }, skipFetchSetup: true },
      { chainId: 296, name: "hedera-testnet" }
    );
    const incentives = new ethers.Contract(incentivesAddress, INCENTIVES_ABI, provider);
    const supplyChain = new ethers.Contract(supplyChainAddress, SUPPLY_CHAIN_ABI, provider);

    const result = await incentives.getLeaderboard(role, limit);

    // Enrich with names from SupplyChain contract
    const entries = await Promise.all(
      result.addresses.map(async (addr: string, i: number) => {
        let name = "";
        let location = "";
        try {
          const p = await supplyChain.participants(addr);
          name = p.name;
          location = p.location;
        } catch {}

        return {
          rank: i + 1,
          address: addr,
          name,
          role,
          location,
          reputationScore: result.reputations[i].toNumber(),
          totalSTR: result.strBalances[i].toNumber(),
          streakDays: result.streaks[i].toNumber(),
          checkpointCount: result.cpCounts[i].toNumber(),
          verificationCount: result.verifyCounts[i].toNumber(),
        };
      })
    );

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
