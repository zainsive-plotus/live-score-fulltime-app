// ===== src/components/team/TeamSquadWidget.tsx =====
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Users, Shield, Zap, Goal, UserCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Define position colors for better visual grouping
const positionStyles: {
  [key: string]: { bg: string; text: string; border: string };
} = {
  Goalkeeper: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/50",
  },
  Defender: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/50",
  },
  Midfielder: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/50",
  },
  Attacker: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/50",
  },
};

const PlayerRow = ({ player }: { player: any }) => {
  const style = positionStyles[player.position] || {
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/50",
  };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg border-l-4 transition-all duration-200 hover:bg-white/5 ${style.border}`}
    >
      <div className="relative flex-shrink-0">
        <Image
          src={proxyImageUrl(player.photo)}
          alt={player.name}
          width={40}
          height={40}
          className="rounded-full bg-gray-800"
        />
        <span
          className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${style.bg} border-2 border-brand-secondary`}
        >
          {player.number || "?"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate text-sm">{player.name}</p>
        <p className={`text-xs font-semibold ${style.text}`}>
          {player.position}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold text-white text-sm">{player.age}</p>
        <p className="text-xs text-brand-muted">{player.nationality}</p>
      </div>
    </div>
  );
};

export default function TeamSquadWidget({ squad }: { squad: any[] }) {
  const [filter, setFilter] = useState("All");
  const { t } = useTranslation();

  const filteredSquad = useMemo(() => {
    if (!squad || squad.length === 0) return [];
    if (filter === "All") return squad;
    return squad.filter((p) => p.position === filter);
  }, [squad, filter]);

  const squadSummary = useMemo(() => {
    if (!squad || squad.length === 0) return { count: 0, avgAge: 0 };
    const validPlayers = squad.filter((p) => p.age);
    const totalAge = validPlayers.reduce((acc, p) => acc + p.age, 0);
    return {
      count: squad.length,
      avgAge:
        validPlayers.length > 0
          ? (totalAge / validPlayers.length).toFixed(1)
          : "N/A",
    };
  }, [squad]);

  const filterButtons = [
    { label: t("filter_all"), value: "All", icon: Users },
    {
      label: t("squad_filter_goalkeeper"),
      value: "Goalkeeper",
      icon: UserCircle,
    },
    { label: t("squad_filter_defender"), value: "Defender", icon: Shield },
    { label: t("squad_filter_midfielder"), value: "Midfielder", icon: Zap },
    { label: t("squad_filter_attacker"), value: "Attacker", icon: Goal },
  ];

  return (
    <div className="bg-brand-secondary rounded-lg">
      <div className="p-4 md:p-6 border-b border-gray-700/50">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} /> {t("full_squad")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-text-muted">{t("total_players")}</p>
              <p className="font-bold text-white">{squadSummary.count}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">{t("average_age")}</p>
              <p className="font-bold text-white">{squadSummary.avgAge}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-1 rounded-lg bg-[var(--color-primary)] mt-4">
          {filterButtons.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                filter === value
                  ? "bg-[var(--brand-accent)] text-white"
                  : "text-text-muted hover:bg-gray-700/50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* NEW: Compact List Layout */}
      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {!squad || squad.length === 0 ? (
          <div className="text-center py-8 text-brand-muted">
            {t("squad_info_unavailable")}
          </div>
        ) : (
          filteredSquad.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))
        )}
      </div>
    </div>
  );
}
