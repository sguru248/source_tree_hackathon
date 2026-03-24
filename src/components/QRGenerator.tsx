"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { useRef } from "react";

interface QRGeneratorProps {
  productId: number;
  productName: string;
  size?: number;
}

export default function QRGenerator({ productId, productName, size = 200 }: QRGeneratorProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${productId}`;

  function downloadQR() {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      const a = document.createElement("a");
      a.download = `sourcetrace-${productId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={svgRef} className="bg-white p-4 rounded-xl">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#111827"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-sm text-gray-400 text-center">{productName}</p>
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Download size={14} />
        Download QR Code
      </button>
    </div>
  );
}
