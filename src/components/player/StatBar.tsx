// ===== src/components/player/StatBar.tsx =====
"use client";

import { memo } from "react";

interface StatBarProps {
  label: string;
  value: string | number;
  percent: number; // A value from 0 to 100
}

const StatBar = memo(function StatBar({ label, value, percent }: StatBarProps) {
  // A more vibrant, professional color gradient
  const gradient = `linear-gradient(90deg, #38b2ac 0%, #38a169 50%, #f59e0b 85%, #e53e3e 100%)`;

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-1.5">
        <span className="text-text-muted font-medium">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2 relative overflow-hidden">
        {/* The visible portion of the gradient bar */}
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            background: gradient,
            transition: "width 0.5s ease-in-out",
          }}
        ></div>
      </div>
    </div>
  );
});

export default StatBar;
