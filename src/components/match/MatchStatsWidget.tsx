"use client";

import { memo } from "react";
import { BarChart3, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface MatchStatsWidgetProps {
  statistics: any[];
  teams: { home: any; away: any };
}

const StatRow = memo(
  ({
    stat,
    homeValue,
    awayValue,
  }: {
    stat: string;
    homeValue: string | number;
    awayValue: string | number;
  }) => {
    const homeNum = parseFloat(String(homeValue).replace("%", "")) || 0;
    const awayNum = parseFloat(String(awayValue).replace("%", "")) || 0;
    const total = homeNum + awayNum;
    const homePercent = total > 0 ? (homeNum / total) * 100 : 50;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-sm px-1">
          <span className="font-bold text-white w-1/4 text-left">
            {homeValue ?? 0}
          </span>
          <span className="text-text-muted w-1/2 text-center">{stat}</span>
          <span className="font-bold text-white w-1/4 text-right">
            {awayValue ?? 0}
          </span>
        </div>
        <div className="flex w-full h-2 rounded-full overflow-hidden bg-[var(--color-primary)]">
          <div
            className="bg-[var(--brand-accent)] rounded-l-full"
            style={{ width: `${homePercent}%` }}
          ></div>
          <div
            className="bg-blue-500 rounded-r-full"
            style={{ width: `${100 - homePercent}%` }}
          ></div>
        </div>
      </div>
    );
  }
);
StatRow.displayName = "StatRow";

const MatchStatsWidget = memo(function MatchStatsWidget({
  statistics,
  teams,
}: MatchStatsWidgetProps) {
  const { t } = useTranslation(); // <-- Use hook

  if (!statistics || statistics.length < 2) {
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

  const homeStats =
    statistics.find((s) => s.team.id === teams.home.id)?.statistics || [];
  const awayStats =
    statistics.find((s) => s.team.id === teams.away.id)?.statistics || [];

  const allStatTypes = Array.from(
    new Set([
      ...homeStats.map((s: any) => s.type),
      ...awayStats.map((s: any) => s.type),
    ])
  );

  return (
    <div className="bg-brand-secondary rounded-lg p-4 md:p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <BarChart3 size={22} /> {t("match_statistics")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {allStatTypes.map((type) => {
          const homeStat =
            homeStats.find((s: any) => s.type === type)?.value ?? 0;
          const awayStat =
            awayStats.find((s: any) => s.type === type)?.value ?? 0;

          return (
            <StatRow
              key={type}
              stat={type}
              homeValue={homeStat}
              awayValue={awayStat}
            />
          );
        })}
      </div>
    </div>
  );
});

export default MatchStatsWidget;
