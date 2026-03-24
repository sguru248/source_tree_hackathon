"use client";

import { Product, Checkpoint, StatusLabels } from "@/types";
import { ShieldCheck, ExternalLink, MapPin, Package, Calendar } from "lucide-react";

interface NFTCertificateProps {
  product: Product;
  checkpoints: Checkpoint[];
}

export default function NFTCertificate({ product, checkpoints }: NFTCertificateProps) {
  const hashscanUrl = process.env.NEXT_PUBLIC_HASHSCAN_URL || "https://hashscan.io/testnet";
  const firstCheckpoint = checkpoints[0];
  const lastCheckpoint = checkpoints[checkpoints.length - 1];

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-emerald-500/30 rounded-2xl p-8 max-w-lg mx-auto overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(16,185,129,0.1) 35px, rgba(16,185,129,0.1) 36px)"
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={28} />
            <span className="text-emerald-400 font-bold text-lg">VERIFIED</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            NFT #{product.nftSerialNumber || "N/A"}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
        <p className="text-gray-400 text-sm mb-6">Batch: {product.batchId}</p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-6" />

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin size={12} />
              Origin
            </div>
            <p className="text-white text-sm">{product.origin}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Package size={12} />
              Destination
            </div>
            <p className="text-white text-sm">{lastCheckpoint?.locationName || "N/A"}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar size={12} />
              Harvested
            </div>
            <p className="text-white text-sm">
              {firstCheckpoint
                ? new Date(firstCheckpoint.timestamp * 1000).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar size={12} />
              Delivered
            </div>
            <p className="text-white text-sm">
              {lastCheckpoint
                ? new Date(lastCheckpoint.timestamp * 1000).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Journey summary */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 mb-2">Journey Summary</p>
          <div className="flex items-center gap-2 flex-wrap">
            {checkpoints.map((cp, i) => (
              <span key={cp.id} className="flex items-center gap-1 text-xs text-gray-300">
                {cp.locationName.split(",")[0]}
                {i < checkpoints.length - 1 && <span className="text-emerald-500 mx-1">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Checkpoints count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{checkpoints.length} verified checkpoints</span>
          <span className="text-gray-500 text-xs">Powered by Hedera</span>
        </div>

        {/* Links */}
        {product.hcsTopicId && product.hcsTopicId !== "0.0.demo" && (
          <div className="mt-4 flex gap-3">
            <a
              href={`${hashscanUrl}/topic/${product.hcsTopicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <ExternalLink size={12} />
              View on HashScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
