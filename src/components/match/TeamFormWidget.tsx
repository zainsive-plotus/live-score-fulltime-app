"use client";

import { TrendingUp, Shield, BarChart2 } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface TeamFormWidgetProps {
  teamStats: any;
  team: any;
  location: "Home" | "Away";
}

// ... StatRow and FormPill components remain the same ...
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
}: TeamFormWidgetProps) {
  const { t } = useTranslation(); // <-- Use hook

  if (!teamStats || !teamStats.form) {
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

  const formArray = teamStats.form.slice(-10).split("");
  const goalsFor = teamStats.goals.for.total.total;
  const goalsAgainst = teamStats.goals.against.total.total;

  return (
    <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
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

      <div>
        <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
          <BarChart2 size={16} /> {t("performance_title")}
        </h4>
        <div className="bg-gray-800/50 p-2 rounded-md">
          <StatRow
            label={t("matches_played")}
            value={`${teamStats.fixtures.played.home} (${t("home_short")}) / ${
              teamStats.fixtures.played.away
            } (${t("away_short")})`}
          />
          <StatRow
            label={t("wins")}
            value={`${teamStats.fixtures.wins.home} (${t("home_short")}) / ${
              teamStats.fixtures.wins.away
            } (${t("away_short")})`}
          />
          <StatRow
            label={t("draws")}
            value={`${teamStats.fixtures.draws.home} (${t("home_short")}) / ${
              teamStats.fixtures.draws.away
            } (${t("away_short")})`}
          />
          <StatRow
            label={t("losses")}
            value={`${teamStats.fixtures.loses.home} (${t("home_short")}) / ${
              teamStats.fixtures.loses.away
            } (${t("away_short")})`}
          />
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
          <Shield size={16} /> {t("goal_analysis_title")}
        </h4>
        <div className="bg-gray-800/50 p-2 rounded-md">
          <StatRow label={t("goals_for")} value={goalsFor} highlight />
          <StatRow label={t("goals_against")} value={goalsAgainst} />
          <StatRow
            label={t("avg_scored")}
            value={teamStats.goals.for.average.total}
          />
          <StatRow
            label={t("avg_conceded")}
            value={teamStats.goals.against.average.total}
          />
        </div>
      </div>
    </div>
  );
}
