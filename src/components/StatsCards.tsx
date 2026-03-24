"use client";

import { Coins, MapPin, ShieldCheck, TrendingUp, Package, Award } from "lucide-react";
import { ParticipantStats } from "@/types";

interface StatsCardsProps {
  stats: ParticipantStats | null;
  productCount?: number;
}

export default function StatsCards({ stats, productCount = 0 }: StatsCardsProps) {
  const cards = [
    {
      label: "STR Earned",
      value: stats?.totalSTR.toLocaleString() || "0",
      icon: Coins,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Reputation",
      value: stats?.reputationScore.toString() || "0",
      suffix: "/100",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Checkpoints",
      value: stats?.checkpointCount.toString() || "0",
      icon: MapPin,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Verifications",
      value: stats?.verificationCount.toString() || "0",
      icon: ShieldCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Products",
      value: productCount.toString(),
      icon: Package,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Badges",
      value: stats?.badgeCount.toString() || "0",
      suffix: "/9",
      icon: Award,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map(({ label, value, suffix, icon: Icon, color, bg }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
            <Icon size={16} className={color} />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-bold ${color}`}>{value}</span>
            {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
