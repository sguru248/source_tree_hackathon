"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Leaf, MapPin, ShieldCheck, QrCode, ArrowRight,
  Package, Users, CheckCircle, Globe, Zap, DollarSign
} from "lucide-react";
import { DEMO_CHECKPOINTS, DEMO_PRODUCT } from "@/lib/demo-data";

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
      <Icon className="mx-auto mb-3 text-emerald-400" size={28} />
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
        <Icon className="text-emerald-400" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const [animatedStep, setAnimatedStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedStep((s) => (s + 1) % (DEMO_CHECKPOINTS.length + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400">Built on Hedera Hashgraph</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Scan Your Food,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Know Its Story
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              SourceTrace verifies every step of your food&apos;s journey from farm to fork.
              GPS-tagged checkpoints, immutable audit logs, and NFT certificates — all on-chain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/track/1"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium transition-colors text-lg"
              >
                <MapPin size={20} />
                Try Live Demo
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/scan"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3.5 rounded-xl font-medium transition-colors text-lg border border-gray-700"
              >
                <QrCode size={20} />
                Scan QR Code
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Journey animation preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Globe size={18} className="text-emerald-400" />
            <span className="text-sm text-gray-400">Live Journey Preview — {DEMO_PRODUCT.name}</span>
          </div>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {DEMO_CHECKPOINTS.map((cp, i) => (
              <div key={cp.id} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      i < animatedStep
                        ? "bg-emerald-500 text-white scale-110"
                        : i === animatedStep
                        ? "bg-emerald-500/50 text-emerald-200 scale-105 animate-pulse"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center transition-colors ${
                    i <= animatedStep ? "text-emerald-400" : "text-gray-600"
                  }`}>
                    {cp.locationName.split(",")[0]}
                  </span>
                </div>
                {i < DEMO_CHECKPOINTS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 transition-colors duration-500 ${
                    i < animatedStep ? "bg-emerald-500" : "bg-gray-800"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package} value="$40B" label="Annual Food Fraud" />
          <StatCard icon={Zap} value="10K+" label="Hedera TPS" />
          <StatCard icon={DollarSign} value="$0.0001" label="Per Transaction" />
          <StatCard icon={Globe} value="Carbon-" label="Negative Network" />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Three Hedera services working together to create an unbreakable chain of trust.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={MapPin}
            title="Smart Contracts"
            desc="Supply chain logic on Hedera EVM. Register participants, create products, and log GPS-tagged checkpoints — all verifiable on-chain."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="HCS Audit Trail"
            desc="Every checkpoint is logged as an immutable message on the Hedera Consensus Service. Tamper-proof timestamps you can trust."
          />
          <FeatureCard
            icon={Leaf}
            title="NFT Certificates"
            desc="Verified products receive an NFT certificate via Hedera Token Service. Proof of authenticity that travels with the product."
          />
        </div>
      </section>

      {/* Consumer experience steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Consumer Experience</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Scan", desc: "Scan the QR code on the product packaging", icon: QrCode },
            { step: "2", title: "Explore", desc: "See the interactive map with every checkpoint", icon: MapPin },
            { step: "3", title: "Verify", desc: "Check the immutable blockchain audit trail", icon: ShieldCheck },
            { step: "4", title: "Trust", desc: "View the NFT certificate of authenticity", icon: CheckCircle },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="text-emerald-400" size={28} />
              </div>
              <div className="text-xs text-emerald-400 font-mono mb-1">Step {step}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">See It In Action</h2>
          <p className="text-gray-400 mb-8">
            Track Ethiopian Sidama coffee across 6 checkpoints, from a farm at 1900m elevation to a Portland roastery.
          </p>
          <Link
            href="/track/1"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium transition-colors text-lg"
          >
            <MapPin size={20} />
            Launch Demo
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-emerald-400" />
            <span className="text-sm text-gray-400">SourceTrace — Built on Hedera Hashgraph</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>HCS + HTS + Smart Contracts</span>
            <span>|</span>
            <span>Hedera Hello Future Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
