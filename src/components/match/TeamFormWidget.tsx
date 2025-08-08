// ===== src/components/match/TeamFormWidget.tsx =====

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { TrendingUp, Shield, BarChart2, Info } from "lucide-react";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";

interface TeamFormWidgetProps {
  team: any;
  location: "Home" | "Away";
  fixtureData: any; // Used to get IDs for the API call
}

const fetchTeamFormData = async (
  teamId: number,
  leagueId: number,
  season: number
) => {
  const params = new URLSearchParams({
    teamId: teamId.toString(),
    leagueId: leagueId.toString(),
    season: season.toString(),
  });
  const { data } = await axios.get(`/api/team-form-data?${params.toString()}`);
  return data;
};

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

const WidgetSkeleton = () => (
  <div className="bg-brand-secondary p-4 rounded-lg space-y-4 animate-pulse h-[400px]">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-700"></div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-600 rounded"></div>
        <div className="h-5 w-32 bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="h-6 w-1/2 bg-gray-700 rounded"></div>
    <div className="h-8 w-full bg-gray-700/50 rounded"></div>
    <div className="h-6 w-1/2 bg-gray-700 rounded mt-4"></div>
    <div className="h-24 w-full bg-gray-700/50 rounded"></div>
  </div>
);

export default function TeamFormWidget({
  team,
  location,
  fixtureData,
}: TeamFormWidgetProps) {
  const { t } = useTranslation();
  const { league } = fixtureData;

  const {
    data: teamStats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teamFormData", team.id, league.id, league.season],
    queryFn: () => fetchTeamFormData(team.id, league.id, league.season),
    staleTime: 1000 * 60 * 15,
    enabled: !!team.id && !!league.id && !!league.season,
  });

  const { formString, detailedStats } = useMemo(() => {
    let form = "";
    let stats = null;

    if (teamStats && teamStats.fixtures?.played?.total > 0) {
      form = teamStats.form || "";
      stats = {
        fixtures: teamStats.fixtures,
        goals: teamStats.goals,
      };
    }

    return { formString: form, detailedStats: stats };
  }, [teamStats]);

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (isError || !detailedStats) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
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
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-brand-muted text-center py-4">
            {t("stats_unavailable_for_team")}
          </p>
        </div>
      </div>
    );
  }

  const formArray = formString.slice(-10).split("");

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

      {detailedStats && (
        <>
          <div>
            <h4 className="font-semibold text-brand-light mb-1 flex items-center gap-2">
              <BarChart2 size={16} /> {t("performance_title")}
            </h4>
            <div className="bg-gray-800/50 p-2 rounded-md">
              <StatRow
                label={t("matches_played")}
                value={`${detailedStats.fixtures.played.home} (${t(
                  "home_short"
                )}) / ${detailedStats.fixtures.played.away} (${t(
                  "away_short"
                )})`}
              />
              <StatRow
                label={t("wins")}
                value={`${detailedStats.fixtures.wins.home} (${t(
                  "home_short"
                )}) / ${detailedStats.fixtures.wins.away} (${t("away_short")})`}
              />
              <StatRow
                label={t("draws")}
                value={`${detailedStats.fixtures.draws.home} (${t(
                  "home_short"
                )}) / ${detailedStats.fixtures.draws.away} (${t(
                  "away_short"
                )})`}
              />
              <StatRow
                label={t("losses")}
                value={`${detailedStats.fixtures.loses.home} (${t(
                  "home_short"
                )}) / ${detailedStats.fixtures.loses.away} (${t(
                  "away_short"
                )})`}
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
      )}
    </div>
  );
}
