"use client";

import { getReputationTier } from "@/types";

interface ReputationBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function ReputationBadge({ score, size = "md", showLabel = true }: ReputationBadgeProps) {
  const tier = getReputationTier(score);
  const dims = { sm: 36, md: 52, lg: 72 };
  const d = dims[size];
  const stroke = size === "sm" ? 3 : 4;
  const radius = (d - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const fontSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-sm" : "text-lg";

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: d, height: d }}>
        <svg width={d} height={d} className="-rotate-90">
          <circle
            cx={d / 2} cy={d / 2} r={radius}
            fill="none" stroke="#374151" strokeWidth={stroke}
          />
          <circle
            cx={d / 2} cy={d / 2} r={radius}
            fill="none" stroke={tier.color} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-bold ${fontSize}`} style={{ color: tier.color }}>
          {score}
        </div>
      </div>
      {showLabel && (
        <div>
          <p className="text-xs font-medium" style={{ color: tier.color }}>{tier.label}</p>
          <p className="text-[10px] text-gray-500">Reputation</p>
        </div>
      )}
    </div>
  );
}
