"use client";

import { Coins } from "lucide-react";
import Link from "next/link";

interface TokenBalanceProps {
  balance: number;
  compact?: boolean;
}

export default function TokenBalance({ balance, compact = false }: TokenBalanceProps) {
  if (compact) {
    return (
      <Link href="/rewards" className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors">
        <Coins size={12} />
        <span className="font-bold">{balance.toLocaleString()}</span>
        <span className="text-emerald-500">STR</span>
      </Link>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Coins size={18} className="text-emerald-400" />
        <span className="text-sm font-medium text-white">STR Balance</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-emerald-400">{balance.toLocaleString()}</span>
        <span className="text-sm text-gray-500">STR</span>
      </div>
    </div>
  );
}
