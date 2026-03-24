"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, LayoutDashboard, ScanLine, Search, Trophy, Coins, Flame } from "lucide-react";
import ConnectWallet from "./ConnectWallet";
import { useState, useEffect } from "react";
import { fetchParticipantStats } from "@/lib/incentives";

const navLinks = [
  { href: "/", label: "Home", icon: Leaf },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/scan", label: "Scan", icon: ScanLine },
];

export default function Navbar() {
  const pathname = usePathname();
  const [trackId, setTrackId] = useState("");
  const [strBalance, setStrBalance] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  // Load incentive stats for connected wallet
  useEffect(() => {
    async function loadStats() {
      if (typeof window === "undefined" || !window.ethereum) return;
      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts[0]) {
          const stats = await fetchParticipantStats(accounts[0]);
          if (stats) {
            setStrBalance(stats.totalSTR);
            setStreakDays(stats.streakDays);
          }
        }
      } catch {}
    }
    loadStats();

    // Re-check on account change
    if (typeof window !== "undefined" && window.ethereum) {
      const handler = () => loadStats();
      window.ethereum.on("accountsChanged", handler);
      return () => window.ethereum?.removeListener("accountsChanged", handler);
    }
  }, []);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (trackId.trim()) {
      window.location.href = `/track/${trackId.trim()}`;
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Source<span className="text-emerald-400">Trace</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Track input + Incentive indicators + Wallet */}
          <div className="flex items-center gap-3">
            {/* STR Balance + Streak (visible when wallet connected) */}
            {strBalance !== null && (
              <div className="hidden sm:flex items-center gap-2">
                {streakDays >= 3 && (
                  <div className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md">
                    <Flame size={12} />
                    <span className="font-bold">{streakDays}</span>
                  </div>
                )}
                <Link href="/rewards" className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors">
                  <Coins size={12} />
                  <span className="font-bold">{strBalance.toLocaleString()}</span>
                  <span className="text-emerald-500">STR</span>
                </Link>
              </div>
            )}
            <form onSubmit={handleTrack} className="hidden sm:flex items-center gap-1">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Product ID..."
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className="w-32 bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </form>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </nav>
  );
}
