"use client";

import { Crown, Flame, Coins, ShieldCheck, MapPin } from "lucide-react";
import { LeaderboardEntry, RoleLabels, Role } from "@/types";
import ReputationBadge from "./ReputationBadge";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function LeaderboardTable({ entries, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <Crown className="text-gray-600 mx-auto mb-3" size={40} />
        <p className="text-gray-400">No participants ranked yet.</p>
        <p className="text-sm text-gray-500 mt-1">Start earning reputation to appear on the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isTop3 = entry.rank <= 3;
        const medalColors = ["", "text-yellow-400", "text-gray-300", "text-amber-600"];
        return (
          <div
            key={entry.address}
            className={`bg-gray-900 border rounded-lg p-4 transition-colors ${
              isTop3 ? "border-yellow-500/20 hover:border-yellow-500/40" : "border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isTop3 ? "bg-yellow-500/20" : "bg-gray-800"
              } ${isTop3 ? medalColors[entry.rank] : "text-gray-500"}`}>
                {entry.rank <= 3 ? <Crown size={14} /> : entry.rank}
              </div>

              {/* Reputation score */}
              <ReputationBadge score={entry.reputationScore} size="sm" showLabel={false} />

              {/* Name & info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">
                    {entry.name || shortAddr(entry.address)}
                  </p>
                  {entry.streakDays >= 3 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                      <Flame size={9} /> {entry.streakDays}d
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {entry.location || RoleLabels[entry.role as Role]}
                  {entry.location && ` - ${RoleLabels[entry.role as Role]}`}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1" title="Checkpoints">
                  <MapPin size={11} /> {entry.checkpointCount}
                </span>
                <span className="flex items-center gap-1" title="Verifications">
                  <ShieldCheck size={11} /> {entry.verificationCount}
                </span>
                <span className="flex items-center gap-1 text-emerald-400" title="STR earned">
                  <Coins size={11} /> {entry.totalSTR.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
