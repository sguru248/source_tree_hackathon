"use client";

import { useState, useEffect } from "react";
import { Crown, Loader2, Sprout, Factory, Truck, Store, ShieldCheck as Shield } from "lucide-react";
import Link from "next/link";
import { Role, RoleLabels, LeaderboardEntry } from "@/types";
import LeaderboardTable from "@/components/LeaderboardTable";

const ROLE_TABS = [
  { role: Role.Farmer, label: "Farmers", icon: Sprout },
  { role: Role.Processor, label: "Processors", icon: Factory },
  { role: Role.Distributor, label: "Distributors", icon: Truck },
  { role: Role.Retailer, label: "Retailers", icon: Store },
  { role: Role.Certifier, label: "Certifiers", icon: Shield },
];

export default function LeaderboardPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.Farmer);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?role=${selectedRole}&limit=20`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setEntries([]);
      }
      setLoading(false);
    }
    load();
  }, [selectedRole]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown size={24} className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Top supply chain participants ranked by reputation</p>
        </div>
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
          Back to Dashboard
        </Link>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6 overflow-x-auto">
        {ROLE_TABS.map(({ role, label, icon: Icon }) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              selectedRole === role
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-300">
          <strong>Find Partners:</strong> Retailers and certifiers use this leaderboard to find and invite top-ranked {RoleLabels[selectedRole].toLowerCase()}s to their supply chain projects.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-emerald-400" size={24} />
        </div>
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </div>
  );
}
