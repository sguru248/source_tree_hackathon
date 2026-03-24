"use client";

import { Coins, MapPin, Package, UserPlus, ShieldCheck, Flag, Sparkles } from "lucide-react";
import { RewardEvent } from "@/types";

const ACTION_ICONS: Record<string, React.ElementType> = {
  "Register": UserPlus,
  "Create Product": Package,
  "Add Checkpoint": MapPin,
  "Quality Bonus": Sparkles,
  "Verify Product": ShieldCheck,
  "Flag Product": Flag,
};

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface ActivityFeedProps {
  events: RewardEvent[];
  loading?: boolean;
}

export default function ActivityFeed({ events, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-800 rounded-full" />
            <div className="flex-1">
              <div className="h-3 bg-gray-800 rounded w-2/3 mb-2" />
              <div className="h-2 bg-gray-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6">
        <Coins className="text-gray-600 mx-auto mb-2" size={24} />
        <p className="text-sm text-gray-500">No activity yet. Start by adding checkpoints!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = ACTION_ICONS[event.action] || Coins;
        return (
          <div key={event.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">{event.action}</p>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                  +{event.strEarned} STR
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-500">{timeAgo(event.timestamp)}</span>
                {event.multiplier > 1 && (
                  <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded">
                    {event.multiplier}x streak
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
