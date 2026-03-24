"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Product, Checkpoint } from "@/types";
import { DEMO_PRODUCT, DEMO_CHECKPOINTS } from "@/lib/demo-data";
import NFTCertificate from "@/components/NFTCertificate";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const params = useParams();
  const productId = Number(params.productId);
  const [product, setProduct] = useState<Product | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { fetchProduct, fetchCheckpoints } = await import("@/lib/contracts");
        const p = await fetchProduct(productId);
        const cps = await fetchCheckpoints(productId);
        if (p && cps.length > 0) {
          setProduct(p);
          setCheckpoints(cps);
          setLoading(false);
          return;
        }
      } catch {}
      if (productId === 1) {
        setProduct(DEMO_PRODUCT);
        setCheckpoints(DEMO_CHECKPOINTS);
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="text-gray-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Verification Certificate</h1>
        <p className="text-gray-400">Product #{productId} authenticity verification</p>
      </div>

      <NFTCertificate product={product} checkpoints={checkpoints} />

      <div className="text-center mt-8">
        <Link
          href={`/track/${productId}`}
          className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
        >
          View full journey map →
        </Link>
      </div>
    </div>
  );
}
