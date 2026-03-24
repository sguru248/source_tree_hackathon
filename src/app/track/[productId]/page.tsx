"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Product, Checkpoint, StatusLabels, StatusColors } from "@/types";
import { DEMO_PRODUCT, DEMO_CHECKPOINTS } from "@/lib/demo-data";
import JourneyTimeline from "@/components/JourneyTimeline";
import QRGenerator from "@/components/QRGenerator";
import NFTCertificate from "@/components/NFTCertificate";
import {
  Package, MapPin, Clock, ShieldCheck, ExternalLink, ChevronDown,
  Thermometer, Loader2, AlertTriangle
} from "lucide-react";

// Dynamic import for Leaflet (no SSR)
const JourneyMap = dynamic(() => import("@/components/JourneyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-900 rounded-xl flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-400" size={32} />
    </div>
  ),
});

type Tab = "map" | "timeline" | "certificate" | "qr";

export default function TrackPage() {
  const params = useParams();
  const productId = Number(params.productId);

  const [product, setProduct] = useState<Product | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [activeCheckpoint, setActiveCheckpoint] = useState<number | null>(null);
  const [useLive, setUseLive] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  async function loadData() {
    setLoading(true);
    try {
      // Try live contract first
      const { fetchProduct, fetchCheckpoints } = await import("@/lib/contracts");
      const p = await fetchProduct(productId);
      const cps = await fetchCheckpoints(productId);
      if (p && cps.length > 0) {
        setProduct(p);
        setCheckpoints(cps);
        setUseLive(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Fall back to demo data with warning
      setError("Could not load live data from contract. Showing demo data.");
    }

    // Use demo data for product 1
    if (productId === 1) {
      setProduct(DEMO_PRODUCT);
      setCheckpoints(DEMO_CHECKPOINTS);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-400 mx-auto mb-4" size={40} />
          <p className="text-gray-400">Loading product journey...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="text-gray-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-gray-400">Product #{productId} does not exist or has no data.</p>
        </div>
      </div>
    );
  }

  const statusColor = StatusColors[product.status];
  const firstCp = checkpoints[0];
  const lastCp = checkpoints[checkpoints.length - 1];
  const journeyDays = firstCp && lastCp
    ? Math.ceil((lastCp.timestamp - firstCp.timestamp) / 86400)
    : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "map", label: "Journey Map" },
    { id: "timeline", label: "Timeline" },
    { id: "certificate", label: "Certificate" },
    { id: "qr", label: "QR Code" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4 text-amber-400 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {!useLive && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Demo Data
                </span>
              )}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {StatusLabels[product.status]}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{product.name}</h1>
            <p className="text-gray-400">
              Batch: <span className="font-mono text-gray-300">{product.batchId}</span>
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin size={12} />
              Origin
            </div>
            <p className="text-white font-medium">{product.origin}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Package size={12} />
              Checkpoints
            </div>
            <p className="text-white font-medium">{checkpoints.length}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Clock size={12} />
              Journey
            </div>
            <p className="text-white font-medium">{journeyDays} days</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Thermometer size={12} />
              Temp Range
            </div>
            <p className="text-white font-medium">
              {Math.min(...checkpoints.map((c) => c.temperature))}°C -{" "}
              {Math.max(...checkpoints.map((c) => c.temperature))}°C
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "map" && (
          <div className="space-y-6">
            <JourneyMap checkpoints={checkpoints} activeCheckpoint={activeCheckpoint} />
            <div className="grid lg:grid-cols-2 gap-6">
              <JourneyTimeline
                checkpoints={checkpoints}
                activeCheckpoint={activeCheckpoint}
                onCheckpointClick={setActiveCheckpoint}
              />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Blockchain Verification</h3>
                {product.hcsTopicId && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">HCS Topic ID</p>
                    <p className="text-sm text-emerald-400 font-mono">{product.hcsTopicId}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Every checkpoint is immutably logged on the Hedera Consensus Service.
                      Each message receives a consensus timestamp and sequence number.
                    </p>
                  </div>
                )}
                {product.nftTokenId && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">NFT Certificate</p>
                    <p className="text-sm text-emerald-400 font-mono">
                      {product.nftTokenId} #{product.nftSerialNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      This product has been verified and minted as an NFT on Hedera Token Service.
                    </p>
                  </div>
                )}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Smart Contract</p>
                  <p className="text-sm text-emerald-400 font-mono text-xs break-all">
                    {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "Deployed on Hedera Testnet"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Product data and checkpoint records stored via EVM smart contract on Hedera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="max-w-2xl">
            <JourneyTimeline
              checkpoints={checkpoints}
              activeCheckpoint={activeCheckpoint}
              onCheckpointClick={setActiveCheckpoint}
            />
          </div>
        )}

        {activeTab === "certificate" && (
          <NFTCertificate product={product} checkpoints={checkpoints} />
        )}

        {activeTab === "qr" && (
          <div className="flex justify-center py-12">
            <QRGenerator productId={product.id} productName={product.name} />
          </div>
        )}
      </div>
    </div>
  );
}
