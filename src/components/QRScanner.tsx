"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, XCircle } from "lucide-react";

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function startScanning() {
    setScanning(true);
    setError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          // Extract product ID from URL
          const match = decodedText.match(/\/track\/(\d+)/);
          if (match) {
            scanner.stop();
            router.push(`/track/${match[1]}`);
          } else if (/^\d+$/.test(decodedText)) {
            scanner.stop();
            router.push(`/track/${decodedText}`);
          }
        },
        () => {} // ignore scan failures
      );
    } catch (err: any) {
      setError(err?.message || "Failed to access camera");
      setScanning(false);
    }
  }

  function stopScanning() {
    scannerRef.current?.stop();
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {!scanning ? (
        <button
          onClick={startScanning}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-medium transition-colors text-lg"
        >
          <Camera size={24} />
          Scan QR Code
        </button>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-2">
            <button onClick={stopScanning} className="text-gray-400 hover:text-white transition-colors">
              <XCircle size={24} />
            </button>
          </div>
          <div id="qr-reader" ref={containerRef} className="rounded-xl overflow-hidden" />
        </div>
      )}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
