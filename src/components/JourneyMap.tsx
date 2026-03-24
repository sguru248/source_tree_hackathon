"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Checkpoint, StatusLabels, ProductStatus } from "@/types";
import "leaflet/dist/leaflet.css";

const roleColors: Record<number, string> = {
  0: "#22c55e", // Farmer - green
  1: "#a855f7", // Processor - purple
  2: "#f59e0b", // Distributor - amber
  3: "#3b82f6", // Retailer - blue
  4: "#06b6d4", // Certifier - cyan
};

function statusToRole(status: ProductStatus): number {
  switch (status) {
    case ProductStatus.Created: return 0;
    case ProductStatus.Processing: return 1;
    case ProductStatus.InTransit: return 2;
    case ProductStatus.Delivered: return 3;
    case ProductStatus.Verified: return 4;
    default: return 2;
  }
}

function createIcon(status: ProductStatus, index: number, total: number): L.DivIcon {
  const role = statusToRole(status);
  const color = roleColors[role];
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const size = isFirst || isLast ? 32 : 24;

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size > 24 ? 14 : 11}px;
    ">${index + 1}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function AnimatedRoute({ positions }: { positions: [number, number][] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < positions.length) {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, positions.length]);

  if (visibleCount < 2) return null;

  return (
    <>
      <Polyline
        positions={positions.slice(0, visibleCount)}
        pathOptions={{ color: "#10b981", weight: 3, opacity: 0.8, dashArray: "10, 6" }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: "#10b981", weight: 1, opacity: 0.2 }}
      />
    </>
  );
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

interface JourneyMapProps {
  checkpoints: Checkpoint[];
  activeCheckpoint?: number | null;
}

export default function JourneyMap({ checkpoints, activeCheckpoint }: JourneyMapProps) {
  const positions: [number, number][] = checkpoints.map((cp) => [cp.latitude, cp.longitude]);

  if (checkpoints.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-900 rounded-xl flex items-center justify-center text-gray-500">
        No checkpoints to display
      </div>
    );
  }

  const center = positions[0];

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-700">
      <MapContainer center={center} zoom={3} className="w-full h-full" style={{ background: "#1a1a2e" }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds positions={positions} />
        <AnimatedRoute positions={positions} />
        {checkpoints.map((cp, i) => (
          <Marker
            key={cp.id}
            position={[cp.latitude, cp.longitude]}
            icon={createIcon(cp.status, i, checkpoints.length)}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <div className="font-bold text-base mb-1">{cp.locationName}</div>
                <div className="text-gray-600 mb-2">{StatusLabels[cp.status]}</div>
                <div className="space-y-1 text-xs">
                  <div><strong>Temp:</strong> {cp.temperature}°C</div>
                  <div><strong>Time:</strong> {new Date(cp.timestamp * 1000).toLocaleDateString()}</div>
                  <div className="mt-1 text-gray-500">{cp.notes}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
