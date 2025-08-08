// ===== src/components/match/MatchStatsWidget.tsx =====

"use client";

import { memo, useMemo } from "react";
import {
  BarChart3,
  Info,
  Percent,
  Disc3,
  Shield,
  Square,
  CornerUpRight,
  ShieldAlert,
  Users,
  Flag,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

interface MatchStatsWidgetProps {
  statistics: any[];
  teams: { home: any; away: any };
}

// --- NEW SUB-COMPONENTS FOR ENHANCED UI ---

const PossessionDonut = ({
  home,
  away,
  homeColor,
  awayColor,
}: {
  home: number;
  away: number;
  homeColor: string;
  awayColor: string;
}) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const homeOffset = circumference * (1 - home / 100);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-brand-dark/30 rounded-lg h-full">
      <h4 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-2">
        Ball Possession
      </h4>
      <div className="relative w-40 h-40">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={awayColor}
            strokeWidth="10"
            strokeOpacity="0.3"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={homeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={homeOffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-black text-white text-3xl">
          {home}%
        </div>
      </div>
    </div>
  );
};

const ShotStatCard = ({
  homeStats,
  awayStats,
  homeColor,
  awayColor,
}: {
  homeStats: any;
  awayStats: any;
  homeColor: string;
  awayColor: string;
}) => {
  const StatBar = ({
    label,
    home,
    away,
    hColor,
    aColor,
  }: {
    label: string;
    home: number;
    away: number;
    hColor: string;
    aColor: string;
  }) => {
    const total = home + away;
    const homePercent = total > 0 ? (home / total) * 100 : 50;
    return (
      <div>
        <div className="flex justify-between items-center text-xs text-brand-muted mb-1">
          <span>{home}</span>
          <span>{label}</span>
          <span>{away}</span>
        </div>
        <div className="flex w-full h-2 rounded-full bg-gray-700/50">
          <div
            className="rounded-l-full"
            style={{ width: `${homePercent}%`, backgroundColor: hColor }}
          ></div>
          <div
            className="rounded-r-full"
            style={{ width: `${100 - homePercent}%`, backgroundColor: aColor }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-4 bg-brand-dark/30 rounded-lg h-full space-y-3">
      <h4 className="text-sm font-bold text-brand-muted uppercase tracking-wider">
        Shots
      </h4>
      <StatBar
        label="Total"
        home={homeStats.total}
        away={awayStats.total}
        hColor={homeColor}
        aColor={awayColor}
      />
      <StatBar
        label="On Target"
        home={homeStats.on}
        away={awayStats.on}
        hColor={homeColor}
        aColor={awayColor}
      />
      <StatBar
        label="Off Target"
        home={homeStats.off}
        away={awayStats.off}
        hColor={homeColor}
        aColor={awayColor}
      />
    </div>
  );
};

const SimpleStatCard = ({
  title,
  icon: Icon,
  homeValue,
  awayValue,
  homeColor,
  awayColor,
}: {
  title: string;
  icon: React.ElementType;
  homeValue: number;
  awayValue: number;
  homeColor: string;
  awayColor: string;
}) => (
  <div className="p-4 bg-brand-dark/30 rounded-lg h-full">
    <h4 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2 mb-3">
      <Icon size={14} /> {title}
    </h4>
    <div className="flex justify-around items-center">
      <div className="text-center">
        <p className="text-4xl font-black" style={{ color: homeColor }}>
          {homeValue}
        </p>
      </div>
      <div className="text-2xl font-light text-brand-muted">vs</div>
      <div className="text-center">
        <p className="text-4xl font-black" style={{ color: awayColor }}>
          {awayValue}
        </p>
      </div>
    </div>
  </div>
);

const MatchStatsWidget = memo(function MatchStatsWidget({
  statistics,
  teams,
}: MatchStatsWidgetProps) {
  const { t } = useTranslation();

  const homeColor = "#34D399"; // Green
  const awayColor = "#60A5FA"; // Blue

  const processedStats = useMemo(() => {
    if (!statistics || statistics.length < 2) return null;

    const home =
      statistics.find((s) => s.team.id === teams.home.id)?.statistics || [];
    const away =
      statistics.find((s) => s.team.id === teams.away.id)?.statistics || [];

    const findStat = (stats: any[], type: string) =>
      stats.find((s) => s.type === type)?.value ?? 0;

    return {
      ballPossession: {
        home: parseFloat(findStat(home, "Ball Possession")),
        away: parseFloat(findStat(away, "Ball Possession")),
      },
      shots: {
        home: {
          total: findStat(home, "Total Shots"),
          on: findStat(home, "Shots on Goal"),
          off: findStat(home, "Shots off Goal"),
        },
        away: {
          total: findStat(away, "Total Shots"),
          on: findStat(away, "Shots on Goal"),
          off: findStat(away, "Shots off Goal"),
        },
      },
      corners: {
        home: findStat(home, "Corner Kicks"),
        away: findStat(away, "Corner Kicks"),
      },
      fouls: { home: findStat(home, "Fouls"), away: findStat(away, "Fouls") },
      yellowCards: {
        home: findStat(home, "Yellow Cards"),
        away: findStat(away, "Yellow Cards"),
      },
      redCards: {
        home: findStat(home, "Red Cards"),
        away: findStat(away, "Red Cards"),
      },
    };
  }, [statistics, teams]);

  if (!processedStats) {
    return (
      <div className="bg-brand-secondary rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={22} /> {t("match_statistics")}
        </h2>
        <div className="text-center py-6 text-brand-muted">
          <Info size={28} className="mx-auto mb-2" />
          <p>{t("live_stats_unavailable")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={22} /> {t("match_statistics")}
      </h2>
      <div className="flex justify-between items-center mb-4 p-3 bg-brand-dark/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(teams.home.logo)}
            alt={teams.home.name}
            width={32}
            height={32}
          />
          <span className="font-bold text-white hidden sm:block">
            {teams.home.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-white hidden sm:block">
            {teams.away.name}
          </span>
          <Image
            src={proxyImageUrl(teams.away.logo)}
            alt={teams.away.name}
            width={32}
            height={32}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PossessionDonut
          home={processedStats.ballPossession.home}
          away={processedStats.ballPossession.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <ShotStatCard
          homeStats={processedStats.shots.home}
          awayStats={processedStats.shots.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <SimpleStatCard
          title="Corner Kicks"
          icon={CornerUpRight}
          homeValue={processedStats.corners.home}
          awayValue={processedStats.corners.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <SimpleStatCard
          title="Fouls"
          icon={ShieldAlert}
          homeValue={processedStats.fouls.home}
          awayValue={processedStats.fouls.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <SimpleStatCard
          title="Yellow Cards"
          icon={Square}
          homeValue={processedStats.yellowCards.home}
          awayValue={processedStats.yellowCards.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <SimpleStatCard
          title="Red Cards"
          icon={Square}
          homeValue={processedStats.redCards.home}
          awayValue={processedStats.redCards.away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      </div>
    </div>
  );
});

export default MatchStatsWidget;
