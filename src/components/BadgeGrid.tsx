"use client";

import {
  Footprints, Map, Trophy, ShieldCheck, BadgeCheck,
  Flame, Zap, Star, Thermometer, Lock,
} from "lucide-react";
import { Badge } from "@/types";

const BADGE_ICONS: Record<string, React.ElementType> = {
  "footprints": Footprints,
  "map": Map,
  "trophy": Trophy,
  "shield-check": ShieldCheck,
  "badge-check": BadgeCheck,
  "flame": Flame,
  "zap": Zap,
  "star": Star,
  "thermometer": Thermometer,
};

interface BadgeGridProps {
  badges: Badge[];
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map(badge => {
        const Icon = BADGE_ICONS[badge.icon] || Star;
        return (
          <div
            key={badge.id}
            className={`relative rounded-xl p-3 border text-center transition-all ${
              badge.unlocked
                ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                : "bg-gray-900 border-gray-800 opacity-50"
            }`}
          >
            <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
              badge.unlocked ? "bg-emerald-500/20" : "bg-gray-800"
            }`}>
              {badge.unlocked ? (
                <Icon size={20} className="text-emerald-400" />
              ) : (
                <Lock size={16} className="text-gray-600" />
              )}
            </div>
            <p className={`text-xs font-medium ${badge.unlocked ? "text-white" : "text-gray-600"}`}>
              {badge.name}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}
