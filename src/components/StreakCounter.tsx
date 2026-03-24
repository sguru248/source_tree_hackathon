"use client";

import { Flame, Zap } from "lucide-react";
import { getStreakMultiplier } from "@/types";

interface StreakCounterProps {
  streakDays: number;
  compact?: boolean;
}

export default function StreakCounter({ streakDays, compact = false }: StreakCounterProps) {
  const multiplier = getStreakMultiplier(streakDays);
  const hasStreak = streakDays >= 3;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
        hasStreak ? "bg-orange-500/10 text-orange-400" : "bg-gray-800 text-gray-500"
      }`}>
        <Flame size={12} />
        <span className="font-bold">{streakDays}</span>
        {hasStreak && <span className="text-[10px]">{multiplier}x</span>}
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 border ${
      hasStreak ? "bg-orange-500/5 border-orange-500/20" : "bg-gray-900 border-gray-800"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={18} className={hasStreak ? "text-orange-400" : "text-gray-600"} />
          <span className="text-sm font-medium text-white">Activity Streak</span>
        </div>
        {hasStreak && (
          <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">
            <Zap size={10} /> {multiplier}x
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${hasStreak ? "text-orange-400" : "text-gray-400"}`}>
          {streakDays}
        </span>
        <span className="text-sm text-gray-500">days</span>
      </div>
      {/* Streak milestone markers */}
      <div className="flex gap-1 mt-3">
        {[3, 7, 30].map(milestone => (
          <div key={milestone} className={`flex-1 h-1.5 rounded-full ${
            streakDays >= milestone ? "bg-orange-400" : "bg-gray-800"
          }`} title={`${milestone}-day streak`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>3d (1.2x)</span>
        <span>7d (1.5x)</span>
        <span>30d (2.0x)</span>
      </div>
    </div>
  );
}
