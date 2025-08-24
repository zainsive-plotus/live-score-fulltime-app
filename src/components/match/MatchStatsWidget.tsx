// ===== src/components/match/MatchStatsWidget.tsx =====

"use client";

import { memo, useMemo } from "react";
import { BarChart3, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";

interface MatchStatsWidgetProps {
  statistics: any[];
  teams: { home: any; away: any };
}

const StatBar = ({
  label,
  home,
  away,
}: {
  label: string;
  home: string | number;
  away: string | number;
}) => {
  const homeVal = parseFloat(home?.toString().replace("%", "")) || 0;
  const awayVal = parseFloat(away?.toString().replace("%", "")) || 0;
  const total = homeVal + awayVal;
  const homePercent = total > 0 ? (homeVal / total) * 100 : 50;

  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm font-semibold px-1">
        <span className="text-white">{home}</span>
        <span className="text-text-muted">{label}</span>
        <span className="text-white">{away}</span>
      </div>
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-700/50">
        <div
          className="bg-brand-purple rounded-l-full"
          style={{ width: `${homePercent}%` }}
        ></div>
        <div
          className="bg-blue-600 rounded-r-full"
          style={{ width: `${100 - homePercent}%` }}
        ></div>
      </div>
    </div>
  );
};

const MatchStatsWidget = memo(function MatchStatsWidget({
  statistics,
  teams,
}: MatchStatsWidgetProps) {
  const { t } = useTranslation();

  const processedStats = useMemo(() => {
    // ** THE FIX IS HERE: Safely access statistics with optional chaining **
    const home =
      statistics.find((s) => s.team.id === teams.home.id)?.statistics || [];
    const away =
      statistics.find((s) => s.team.id === teams.away.id)?.statistics || [];

    const findStat = (stats: any[], type: string) =>
      stats.find((s) => s.type === type)?.value ?? 0;

    const statTypes = [
      "Shots on Goal",
      "Shots off Goal",
      "Total Shots",
      "Blocked Shots",
      "Corner Kicks",
      "Offsides",
      "Ball Possession",
      "Fouls",
      "Yellow Cards",
      "Red Cards",
      "Goalkeeper Saves",
      "Total passes",
      "Passes accurate",
    ];

    const allStats: { type: string; home: any; away: any }[] = [];

    statTypes.forEach((type) => {
      const homeValue = findStat(home, type);
      const awayValue = findStat(away, type);
      if (homeValue !== 0 || awayValue !== 0) {
        allStats.push({ type, home: homeValue, away: awayValue });
      }
    });

    return allStats;
  }, [statistics, teams]);

  if (!processedStats || processedStats.length === 0) {
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
        </div>
        <div className="flex items-center gap-3">
          <Image
            src={proxyImageUrl(teams.away.logo)}
            alt={teams.away.name}
            width={32}
            height={32}
          />
        </div>
      </div>

      <div className="space-y-4">
        {processedStats.map((stat) => (
          <StatBar
            key={stat.type}
            label={stat.type}
            home={stat.home}
            away={stat.away}
          />
        ))}
      </div>
    </div>
  );
});

export default MatchStatsWidget;
