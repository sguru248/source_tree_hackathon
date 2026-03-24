"use client";

import { useState, useEffect } from "react";
import { Coins, ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import {
  ParticipantStats, RewardEvent, Badge, Role, RoleLabels,
  BADGE_DEFINITIONS, getStreakMultiplier,
} from "@/types";
import { fetchParticipantStats, fetchRecentRewards, fetchBadges, stakeSTR } from "@/lib/incentives";
import { checkParticipant } from "@/lib/contracts";
import ReputationBadge from "@/components/ReputationBadge";
import StreakCounter from "@/components/StreakCounter";
import TokenBalance from "@/components/TokenBalance";
import BadgeGrid from "@/components/BadgeGrid";
import ActivityFeed from "@/components/ActivityFeed";
import StatsCards from "@/components/StatsCards";

export default function RewardsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantRole, setParticipantRole] = useState<Role>(Role.Farmer);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [rewards, setRewards] = useState<RewardEvent[]>([]);
  const [badges, setBadges] = useState<Badge[]>(BADGE_DEFINITIONS);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined" || !window.ethereum) {
        setLoading(false);
        return;
      }
      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts[0]) {
          setAccount(accounts[0]);
          const p = await checkParticipant(accounts[0]);
          if (p.isRegistered) {
            setParticipantName(p.name);
            setParticipantRole(p.role);
          }

          const [s, r, b] = await Promise.all([
            fetchParticipantStats(accounts[0]),
            fetchRecentRewards(accounts[0]),
            fetchBadges(accounts[0]),
          ]);
          if (s) setStats(s);
          setRewards(r);
          setBadges(b);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleStake() {
    setStaking(true);
    setStakeError(null);
    try {
      const tx = await stakeSTR();
      await tx.wait();
      // Refresh stats
      if (account) {
        const s = await fetchParticipantStats(account);
        if (s) setStats(s);
      }
    } catch (err: any) {
      setStakeError(err.reason || err.message || "Staking failed");
    }
    setStaking(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Coins className="text-gray-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Rewards & Analytics</h2>
          <p className="text-gray-400">Connect your MetaMask wallet to view your rewards, reputation, and badges.</p>
        </div>
      </div>
    );
  }

  const isCertifier = participantRole === Role.Certifier;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-2 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">My Rewards</h1>
          <p className="text-gray-400 text-sm mt-1">{participantName} - {RoleLabels[participantRole]}</p>
        </div>
        <ReputationBadge score={stats?.reputationScore || 0} size="lg" />
      </div>

      {/* Stats cards */}
      <div className="mb-6">
        <StatsCards stats={stats} />
      </div>

      {/* Streak + Token row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StreakCounter streakDays={stats?.streakDays || 0} />
        <TokenBalance balance={stats?.totalSTR || 0} />
      </div>

      {/* Certifier Staking */}
      {isCertifier && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={18} className="text-purple-400" />
            <h3 className="text-white font-medium">Certifier Staking</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Stake 500 STR to certify products. Staked tokens can be slashed (-100 STR) if you verify a flagged product.
          </p>
          {stats && stats.totalSTR >= 500 ? (
            <button
              onClick={handleStake}
              disabled={staking}
              className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
              {staking ? "Staking..." : "Stake 500 STR"}
            </button>
          ) : (
            <p className="text-xs text-gray-500">Need 500 STR to stake. Current: {stats?.totalSTR || 0} STR</p>
          )}
          {stakeError && <p className="text-red-400 text-xs mt-2">{stakeError}</p>}
        </div>
      )}

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Badges ({badges.filter(b => b.unlocked).length}/9)</h3>
        <BadgeGrid badges={badges} />
      </div>

      {/* Activity feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <ActivityFeed events={rewards} />
      </div>
    </div>
  );
}
