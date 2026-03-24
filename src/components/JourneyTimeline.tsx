"use client";

import { Checkpoint, StatusLabels, StatusColors, ProductStatus } from "@/types";
import { MapPin, Thermometer, Clock, CheckCircle2, Truck, Factory, Sprout, Store } from "lucide-react";

function getStatusIcon(status: ProductStatus) {
  switch (status) {
    case ProductStatus.Created: return <Sprout size={18} />;
    case ProductStatus.Processing: return <Factory size={18} />;
    case ProductStatus.InTransit: return <Truck size={18} />;
    case ProductStatus.Delivered: return <Store size={18} />;
    case ProductStatus.Verified: return <CheckCircle2 size={18} />;
    default: return <MapPin size={18} />;
  }
}

interface JourneyTimelineProps {
  checkpoints: Checkpoint[];
  activeCheckpoint?: number | null;
  onCheckpointClick?: (index: number) => void;
}

export default function JourneyTimeline({ checkpoints, activeCheckpoint, onCheckpointClick }: JourneyTimelineProps) {
  return (
    <div className="space-y-0">
      {checkpoints.map((cp, index) => {
        const isActive = activeCheckpoint === index;
        const isLast = index === checkpoints.length - 1;
        const color = StatusColors[cp.status];

        return (
          <div
            key={cp.id}
            className={`relative flex gap-4 cursor-pointer group ${isActive ? "scale-[1.02]" : ""} transition-transform`}
            onClick={() => onCheckpointClick?.(index)}
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg transition-all group-hover:scale-110"
                style={{ backgroundColor: color }}
              >
                {getStatusIcon(cp.status)}
              </div>
              {!isLast && (
                <div className="w-0.5 h-full min-h-[40px] bg-gray-700" />
              )}
            </div>

            {/* Content card */}
            <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
              <div
                className={`bg-gray-800/50 border rounded-lg p-4 transition-all group-hover:bg-gray-800 ${
                  isActive ? "border-emerald-500 bg-gray-800" : "border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{cp.locationName}</h4>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {StatusLabels[cp.status]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
                </div>

                <p className="text-sm text-gray-400 mb-3">{cp.notes}</p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Thermometer size={12} />
                    {cp.temperature}°C
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(cp.timestamp * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {cp.latitude.toFixed(2)}, {cp.longitude.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
