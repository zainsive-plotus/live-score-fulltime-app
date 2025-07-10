// src/components/team/TeamSquadWidget.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Users, Shield, Zap, Goal, UserCircle } from "lucide-react";

// --- NEW: Player Card Component ---
const PlayerCard = ({ player }: { player: any }) => {
  return (
    <div className="bg-[var(--color-primary)] rounded-lg overflow-hidden group relative transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--brand-accent)]/20">
      {/* Player Number */}
      <span className="absolute top-2 right-2 text-4xl font-black text-white/10 group-hover:text-white/20 transition-colors duration-300">
        {player.number || "N/A"}
      </span>

      <div className="flex flex-col items-center p-4">
        <div className="relative w-24 h-24 mb-3">
          <Image
            src={proxyImageUrl(player.photo)}
            alt={player.name}
            layout="fill"
            objectFit="contain"
            className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <h4 className="font-bold text-lg text-white text-center truncate w-full">
          {player.name}
        </h4>
        <p className="text-sm text-text-muted">{player.position}</p>
      </div>

      {/* Stats Footer */}
      <div className="bg-black/20 p-2 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="text-text-secondary">
          <strong className="text-white">{player.age}</strong> years
        </div>
        <div className="text-text-secondary truncate">
          <strong className="text-white">{player.nationality}</strong>
        </div>
      </div>
    </div>
  );
};

// --- Main Enhanced Widget ---
export default function TeamSquadWidget({ squad }: { squad: any[] }) {
  const [filter, setFilter] = useState("All");

  const filteredSquad = useMemo(() => {
    if (filter === "All") return squad;
    return squad.filter((p) => p.position === filter);
  }, [squad, filter]);

  const squadSummary = useMemo(() => {
    if (!squad || squad.length === 0) return { count: 0, avgAge: 0 };
    const totalAge = squad.reduce((acc, p) => acc + (p.age || 0), 0);
    return {
      count: squad.length,
      avgAge: (totalAge / squad.length).toFixed(1),
    };
  }, [squad]);

  const filterButtons = [
    { label: "All", icon: Users },
    { label: "Goalkeeper", icon: UserCircle },
    { label: "Defender", icon: Shield },
    { label: "Midfielder", icon: Zap },
    { label: "Attacker", icon: Goal },
  ];

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={22} /> Full Squad
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-text-muted">Total Players</p>
            <p className="font-bold text-white">{squadSummary.count}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Average Age</p>
            <p className="font-bold text-white">{squadSummary.avgAge}</p>
          </div>
        </div>
      </div>

      {/* --- NEW: Filter Controls --- */}
      <div className="flex flex-wrap items-center gap-2 p-1 rounded-lg bg-[var(--color-primary)] mb-6">
        {filterButtons.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              filter === label
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700/50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* --- NEW: Grid of Player Cards --- */}
      {squad && squad.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSquad.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-text-muted">
          Squad information is not available.
        </p>
      )}
    </div>
  );
}
