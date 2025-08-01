// ===== src/components/directory/LeagueDetailWidget.tsx =====

"use client"; // ***** FIX IS HERE: Mark this as a Client Component *****

import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Shield, Flag, Calendar, BarChart3, Goal, Trophy } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface League {
  name: string;
  logo: string;
  type: string;
  country: string;
  season: number;
}
interface LeagueStats {
  totalGoals: number;
  avgGoals: string;
  totalMatches: number;
}
interface TopScorerPlayer {
  id: number;
  name: string;
  photo: string;
}
interface TopScorerStats {
  goals: { total: number };
  team: { name: string };
}
interface TopScorer {
  player: TopScorerPlayer;
  statistics: TopScorerStats[];
}

interface LeagueDetailWidgetProps {
  league: League;
  leagueStats: LeagueStats | null;
  topScorer: TopScorer | null;
}

const StatItem = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <div className="text-center">
    <Icon size={24} className="mx-auto text-brand-muted mb-1" />
    <p className="font-bold text-white text-lg">{value}</p>
    <p className="text-xs text-brand-muted">{label}</p>
  </div>
);

export default function LeagueDetailWidget({
  league,
  leagueStats,
  topScorer,
}: LeagueDetailWidgetProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden border border-gray-700/50">
      {/* Header Section */}
      <div className="p-4 flex items-center gap-4 bg-gray-800/30">
        <Image
          src={proxyImageUrl(league.logo)}
          alt={`${league.name} logo`}
          width={56}
          height={56}
          className="bg-white rounded-full p-1.5"
        />
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">
            {league.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-brand-muted mt-1">
            <Flag size={14} />
            <span>{league.country}</span>
            <span className="font-bold">·</span>
            <span>{league.season}</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {leagueStats && (
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700/50">
          <StatItem
            label={t("total_matches")}
            icon={BarChart3}
            value={leagueStats.totalMatches}
          />
          <StatItem
            label={t("total_goals")}
            icon={Goal}
            value={leagueStats.totalGoals}
          />
          <StatItem
            label={t("avg_goals")}
            icon={Shield}
            value={leagueStats.avgGoals}
          />
        </div>
      )}

      {/* Top Scorer Section */}
      {topScorer && (
        <div className="p-4">
          <h4 className="font-semibold text-brand-light mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            {t("top_scorer")}
          </h4>
          <div className="flex items-center gap-3">
            <Image
              src={proxyImageUrl(topScorer.player.photo)}
              alt={topScorer.player.name}
              width={40}
              height={40}
              className="rounded-full bg-gray-700"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-sm">
                {topScorer.player.name}
              </p>
              <p className="text-xs text-brand-muted truncate">
                {topScorer.statistics[0].team.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-yellow-400 text-lg">
              <Goal size={16} />
              <span>{topScorer.statistics[0].goals.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
