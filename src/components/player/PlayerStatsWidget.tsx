// ===== src/components/player/PlayerStatsWidget.tsx =====
"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  BarChart3,
  Goal,
  Shield,
  Zap,
  Target,
  Star,
  Info,
  Footprints,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import StatBar from "./StatBar";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

// Enhanced StatCard with gradient and better icon styling
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div
    className={`p-4 rounded-lg flex items-center gap-4 border border-gray-700/50 bg-gradient-to-br from-brand-dark to-brand-secondary`}
  >
    <div
      className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 ${color}/20`}
    >
      <Icon size={24} className={color} />
    </div>
    <div>
      <p className="text-3xl font-black text-white">{value ?? "-"}</p>
      <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">
        {label}
      </p>
    </div>
  </div>
);

// StatGroup component remains the same, but will look better with the new StatBar
const StatGroup = ({
  title,
  icon: Icon,
  children,
  hasData,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  hasData: boolean;
}) => {
  if (!hasData) return null;
  return (
    <div className="bg-brand-dark/30 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2.5 text-lg">
        <Icon size={20} className="text-brand-muted" />
        <span>{title}</span>
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default function PlayerStatsWidget({ stats }: { stats: any[] }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-brand-secondary rounded-xl p-8 text-center text-brand-muted">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_stats_for_season")}</p>
      </div>
    );
  }

  const activeStats = stats[activeIndex];
  const { games, goals, cards, passes, shots, dribbles, tackles, duels } =
    activeStats;

  const shotAccuracy =
    shots?.total && shots.total > 0
      ? Math.round((shots.on / shots.total) * 100)
      : 0;
  const dribbleSuccess =
    dribbles?.attempts && dribbles.attempts > 0
      ? Math.round((dribbles.success / dribbles.attempts) * 100)
      : 0;
  const duelsWon =
    duels?.total && duels.total > 0
      ? Math.round((duels.won / duels.total) * 100)
      : 0;
  const goalsPerMatch =
    games?.appearences && games.appearences > 0
      ? (goals?.total / games.appearences).toFixed(2)
      : "0.00";

  const hasAttackingData = (goals?.total ?? 0) > 0 || (shots?.total ?? 0) > 0;
  const hasPlaymakingData = (passes?.total ?? 0) > 0 || (duels?.total ?? 0) > 0;
  const hasDefendingData = (tackles?.total ?? 0) > 0;

  return (
    <div className="bg-brand-secondary rounded-xl overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <BarChart3 size={24} /> {t("season_statistics")}
        </h2>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-[var(--color-primary)] overflow-x-auto scrollbar-hide">
          {stats.map((stat, index) => (
            <button
              key={stat.league.id}
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeIndex === index
                  ? "bg-brand-dark shadow-inner shadow-black/50 text-white"
                  : "text-text-muted hover:bg-gray-700/50"
              }`}
            >
              {stat.league.logo && (
                <Image
                  src={proxyImageUrl(stat.league.logo)}
                  alt={stat.league.name}
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
              )}
              <span className="truncate">{stat.league.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {/* Key Performance Indicators with new colors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("appearances")}
            value={games.appearences ?? 0}
            icon={Footprints}
            color="text-teal-400"
          />
          <StatCard
            label={t("goals")}
            value={goals.total ?? 0}
            icon={Goal}
            color="text-green-400"
          />
          <StatCard
            label={t("assists")}
            value={goals.assists ?? 0}
            icon={Shield}
            color="text-sky-400"
          />
          <StatCard
            label={t("rating")}
            value={games.rating ? parseFloat(games.rating).toFixed(1) : "-"}
            icon={Star}
            color="text-amber-400"
          />
        </div>

        {/* Detailed Stats Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <StatGroup
            title={t("attacking")}
            icon={Zap}
            hasData={hasAttackingData}
          >
            <StatBar
              label={t("goals_per_match")}
              value={goalsPerMatch}
              percent={parseFloat(goalsPerMatch) * 40}
            />
            <StatBar
              label={t("shots_on_target")}
              value={`${shots?.on ?? 0} / ${shots?.total ?? 0}`}
              percent={shotAccuracy}
            />
            <StatBar
              label={t("dribble_success")}
              value={`${dribbleSuccess}%`}
              percent={dribbleSuccess}
            />
          </StatGroup>

          <StatGroup
            title={t("playmaking")}
            icon={Target}
            hasData={hasPlaymakingData}
          >
            <StatBar
              label={t("pass_accuracy")}
              value={`${passes?.accuracy ?? 0}%`}
              percent={passes?.accuracy ?? 0}
            />
            <StatBar
              label={t("key_passes")}
              value={passes?.key ?? 0}
              percent={((passes?.key ?? 0) / (games?.appearences || 1)) * 30}
            />
            <StatBar
              label={t("duels_won")}
              value={`${duelsWon}%`}
              percent={duelsWon}
            />
          </StatGroup>

          <StatGroup
            title={t("defending")}
            icon={ShieldCheck}
            hasData={hasDefendingData}
          >
            <StatBar
              label={t("tackles")}
              value={tackles?.total ?? 0}
              percent={((tackles?.total ?? 0) / (games?.appearences || 1)) * 30}
            />
            <StatBar
              label={t("interceptions")}
              value={tackles?.interceptions ?? 0}
              percent={
                ((tackles?.interceptions ?? 0) / (games?.appearences || 1)) * 40
              }
            />
            <StatBar
              label={t("blocks")}
              value={tackles?.blocks ?? 0}
              percent={
                ((tackles?.blocks ?? 0) / (games?.appearences || 1)) * 50
              }
            />
          </StatGroup>

          <StatGroup title={t("discipline")} icon={HeartPulse} hasData={true}>
            <StatBar
              label={t("yellow_cards")}
              value={cards?.yellow ?? 0}
              percent={100 - (cards?.yellow ?? 0) * 10}
            />
            <StatBar
              label={t("red_cards")}
              value={cards?.red ?? 0}
              percent={100 - (cards?.red ?? 0) * 50}
            />
            <StatBar
              label={t("fouls_committed")}
              value={duels?.committed ?? 0}
              percent={
                100 - ((duels?.committed ?? 0) / (games?.appearences || 1)) * 25
              }
            />
          </StatGroup>
        </div>
      </div>
    </div>
  );
}
