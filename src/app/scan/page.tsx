"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import { ScanLine, Search, ArrowRight } from "lucide-react";

export default function ScanPage() {
  const [manualId, setManualId] = useState("");
  const router = useRouter();

  function handleManualTrack(e: React.FormEvent) {
    e.preventDefault();
    if (manualId.trim()) {
      router.push(`/track/${manualId.trim()}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ScanLine className="text-emerald-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Scan Product</h1>
        <p className="text-gray-400">
          Scan the QR code on your product packaging to see its complete journey.
        </p>
      </div>

      <div className="space-y-8">
        {/* QR Scanner */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <QRScanner />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-sm text-gray-500">or enter manually</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualTrack} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Enter Product ID (e.g., 1)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Track
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
