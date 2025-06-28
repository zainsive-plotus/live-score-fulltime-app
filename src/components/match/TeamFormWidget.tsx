// src/components/match/TeamFormWidget.tsx
"use client";

import { TrendingUp, Shield, BarChart2 } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

interface TeamFormWidgetProps {
  teamStats: any; // e.g., homeTeamStats or awayTeamStats from the API
  team: any; // The basic team object { id, name, logo }
  location: "Home" | "Away";
}

// --- Reusable Sub-component for a single stat row ---
const StatRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <div className="flex justify-between items-center text-sm py-1.5">
    <span className="text-brand-muted">{label}</span>
    <span
      className={`font-bold ${highlight ? "text-brand-purple" : "text-white"}`}
    >
      {value}
    </span>
  </div>
);

// --- Reusable Sub-component for the W/D/L form display ---
const FormPill = ({ result }: { result: "W" | "D" | "L" }) => {
  const styles = {
    W: "bg-green-500/80 text-white",
    D: "bg-yellow-500/80 text-white",
    L: "bg-red-500/80 text-white",
  };
  return (
    <div
      className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs ${styles[result]}`}
    >
      {result}
    </div>
  );
};

export default function TeamFormWidget({
  teamStats,
  team,
  location,
}: TeamFormWidgetProps) {
  // Don't render if we don't have the necessary stats
  if (!teamStats || !teamStats.form) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">
          Form & Stats ({location})
        </h3>
        <p className="text-sm text-brand-muted text-center py-4">
          Detailed stats not available for this team.
        </p>
      </div>
    );
  }

  const formArray = teamStats.form.slice(-10).split(""); // Get last 10 results
  const goalsFor = teamStats.goals.for.total.total;
  const goalsAgainst = teamStats.goals.against.total.total;

  return (
    <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={proxyImageUrl(team.logo)}
          alt={team.name}
          width={40}
          height={40}
        />
        <div>
          <p className="text-xs text-brand-muted">{location} Team</p>
          <h3 className="text-lg font-bold text-white">{team.name}</h3>
        </div>
      </div>

      {/* Form Section */}
      <div>
        <h4 className="font-semibold text-brand-light mb-2 flex items-center gap-2">
          <TrendingUp size={16} /> Recent Form (Last {formArray.length})
        </h4>
        <div className="flex items-center gap-1.5">
          {formArray.map((result: "W" | "D" | "L", index: number) => (
            <FormPill key={index} result={result} />
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div>
        <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
          <BarChart2 size={16} /> Performance
        </h4>
        <div className="bg-gray-800/50 p-2 rounded-md">
          <StatRow
            label="Matches Played"
            value={`${teamStats.fixtures.played.home} (H) / ${teamStats.fixtures.played.away} (A)`}
          />
          <StatRow
            label="Wins"
            value={`${teamStats.fixtures.wins.home} (H) / ${teamStats.fixtures.wins.away} (A)`}
          />
          <StatRow
            label="Draws"
            value={`${teamStats.fixtures.draws.home} (H) / ${teamStats.fixtures.draws.away} (A)`}
          />
          <StatRow
            label="Losses"
            value={`${teamStats.fixtures.loses.home} (H) / ${teamStats.fixtures.loses.away} (A)`}
          />
        </div>
      </div>

      {/* Goals Section */}
      <div>
        <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
          <Shield size={16} /> Goal Analysis
        </h4>
        <div className="bg-gray-800/50 p-2 rounded-md">
          <StatRow label="Goals For" value={goalsFor} highlight />
          <StatRow label="Goals Against" value={goalsAgainst} />
          <StatRow
            label="Avg. Scored"
            value={teamStats.goals.for.average.total}
          />
          <StatRow
            label="Avg. Conceded"
            value={teamStats.goals.against.average.total}
          />
        </div>
      </div>
    </div>
  );
}
