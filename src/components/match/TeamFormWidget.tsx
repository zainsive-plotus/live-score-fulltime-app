// ===== src/components/match/TeamFormWidget.tsx =====

"use client";

import { useMemo } from "react";
import { TrendingUp, Shield, BarChart2, Info } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamFormWidgetProps {
  teamStats: any;
  team: any;
  location: "Home" | "Away";
  h2hData: any[]; // New prop for fallback data
}

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
  h2hData, // Use the new prop
}: TeamFormWidgetProps) {
  const { t } = useTranslation();

  const { formString, detailedStats } = useMemo(() => {
    let form = "";
    let stats = null;

    // --- Start of Fix ---
    // Primary source: Use detailed teamStats if available
    if (teamStats?.form) {
      form = teamStats.form;
      stats = {
        fixtures: teamStats.fixtures,
        goals: teamStats.goals,
      };
    } 
    // Fallback source: If form is missing, calculate from h2hData
    else if (h2hData) {
      const teamFixtures = h2hData
        .filter(
          (m: any) => m.teams.home.id === team.id || m.teams.away.id === team.id
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
        )
        .slice(0, 10); // Get last 10 to be safe
      
      form = teamFixtures.map((match: any) => {
        const isHome = match.teams.home.id === team.id;
        if (match.teams.home.winner) return isHome ? 'W' : 'L';
        if (match.teams.away.winner) return isHome ? 'L' : 'W';
        return 'D';
      }).reverse().join(''); // Reverse to get chronological order
    }
    // --- End of Fix ---

    return { formString: form, detailedStats: stats };
  }, [teamStats, h2hData, team.id]);

  // Only show the "not available" message if we have NO data at all
  if (!formString && !detailedStats) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">
          {t("form_and_stats_title", { location })}
        </h3>
        <p className="text-sm text-brand-muted text-center py-4">
          {t("stats_unavailable_for_team")}
        </p>
      </div>
    );
  }

  const formArray = formString.slice(-10).split("");

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
          <p className="text-xs text-brand-muted">
            {location === "Home" ? t("home_team") : t("away_team")}
          </p>
          <h3 className="text-lg font-bold text-white">{team.name}</h3>
        </div>
      </div>

      {/* Recent Form (Now uses fallback if needed) */}
      {formArray.length > 0 && (
        <div>
          <h4 className="font-semibold text-brand-light mb-2 flex items-center gap-2">
            <TrendingUp size={16} />{" "}
            {t("recent_form_count", { count: formArray.length })}
          </h4>
          <div className="flex items-center gap-1.5">
            {formArray.map((result: "W" | "D" | "L", index: number) => (
              <FormPill key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Detailed Stats (Render ONLY if available) */}
      {detailedStats ? (
        <>
          <div>
            <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
              <BarChart2 size={16} /> {t("performance_title")}
            </h4>
            <div className="bg-gray-800/50 p-2 rounded-md">
              <StatRow
                label={t("matches_played")}
                value={`${detailedStats.fixtures.played.home} (${t("home_short")}) / ${detailedStats.fixtures.played.away} (${t("away_short")})`}
              />
              <StatRow
                label={t("wins")}
                value={`${detailedStats.fixtures.wins.home} (${t("home_short")}) / ${detailedStats.fixtures.wins.away} (${t("away_short")})`}
              />
              <StatRow
                label={t("draws")}
                value={`${detailedStats.fixtures.draws.home} (${t("home_short")}) / ${detailedStats.fixtures.draws.away} (${t("away_short")})`}
              />
              <StatRow
                label={t("losses")}
                value={`${detailedStats.fixtures.loses.home} (${t("home_short")}) / ${detailedStats.fixtures.loses.away} (${t("away_short")})`}
              />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
              <Shield size={16} /> {t("goal_analysis_title")}
            </h4>
            <div className="bg-gray-800/50 p-2 rounded-md">
              <StatRow
                label={t("goals_for")}
                value={detailedStats.goals.for.total.total}
                highlight
              />
              <StatRow
                label={t("goals_against")}
                value={detailedStats.goals.against.total.total}
              />
              <StatRow
                label={t("avg_scored")}
                value={detailedStats.goals.for.average.total}
              />
              <StatRow
                label={t("avg_conceded")}
                value={detailedStats.goals.against.average.total}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-3 bg-gray-800/50 rounded-md">
           <Info size={18} className="mx-auto text-brand-muted mb-2" />
           <p className="text-sm text-brand-muted">{t("detailed_stats_unavailable")}</p>
        </div>
      )}
    </div>
  );
}