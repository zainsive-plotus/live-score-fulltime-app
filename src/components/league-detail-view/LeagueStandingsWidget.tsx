// ===== src/components/league-detail-view/LeagueStandingsWidget.tsx =====

"use client";

import { useState, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { Info, ListOrdered, Loader2 } from "lucide-react";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { useTranslation } from "@/hooks/useTranslation";
import Slider from "react-slick";

type StandingsView = "all" | "home" | "away";

interface TeamStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

interface TeamStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: TeamStats;
  home: TeamStats;
  away: TeamStats;
  goalsDiff: number;
  description: string | null;
  group: string;
}

interface LeagueStandingsWidgetProps {
  initialStandings: TeamStanding[][];
  leagueSeasons: number[];
  currentSeason: number;
  onSeasonChange?: (season: number) => void;
  isLoading: boolean;
  leagueId?: number;
  leagueSlug?: string;
}

const getRankIndicatorClass = (description: string | null): string => {
  if (!description) return "bg-gray-700/50 border-gray-600/50";
  const desc = description.toLowerCase();
  if (desc.includes("champions league"))
    return "bg-blue-500/20 border-blue-500";
  if (desc.includes("promotion")) return "bg-green-500/20 border-green-500";
  if (desc.includes("europa league"))
    return "bg-orange-500/20 border-orange-500";
  if (desc.includes("relegation")) return "bg-red-600/20 border-red-600";
  return "bg-gray-700/50 border-gray-600/50";
};

const StandingsTable = memo(
  ({
    group,
    view,
    t,
  }: {
    group: TeamStanding[];
    view: StandingsView;
    t: (key: string) => string;
  }) => {
    const processedStandings = useMemo(() => {
      if (view === "all") {
        return group;
      }
      return [...group]
        .map((item) => {
          const stats = item[view];
          const points = stats.win * 3 + stats.draw;
          const goalsDiff = stats.goals.for - stats.goals.against;
          return { ...item, points, goalsDiff, stats };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
          return a.team.name.localeCompare(b.team.name);
        })
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }));
    }, [group, view]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="text-left text-text-muted sticky top-0 bg-brand-secondary z-10">
            <tr className="text-xs uppercase">
              <th className="p-2 w-8 text-center font-semibold">
                {t("table_header_rank_short")}
              </th>
              <th className="p-2 font-semibold">{t("table_header_team")}</th>
              <th className="p-2 text-center font-semibold">
                {t("table_header_played_short")}
              </th>
              <th className="p-2 text-center font-semibold">
                {t("wins_short")}
              </th>
              <th className="p-2 text-center font-semibold">
                {t("draws_short")}
              </th>
              <th className="p-2 text-center font-semibold">
                {t("losses_short")}
              </th>
              <th className="p-2 text-center font-semibold">
                {t("table_header_goaldiff_short")}
              </th>
              <th className="p-2 text-center font-bold">
                {t("table_header_points_short")}
              </th>
            </tr>
          </thead>
          <tbody className="text-brand-light">
            {processedStandings.map((item) => {
              const stats = view === "all" ? item.all : item.stats;
              return (
                <tr
                  key={item.team.id}
                  className="hover:bg-[var(--color-primary)]/50 transition-colors"
                >
                  <td
                    className={`p-2 border-t border-gray-700/50 text-center border-l-4 ${getRankIndicatorClass(
                      item.description
                    )}`}
                  >
                    <span className="font-bold">{item.rank}</span>
                  </td>
                  <td className="p-2 border-t border-gray-700/50">
                    <StyledLink
                      href={generateTeamSlug(item.team.name, item.team.id)}
                      className="flex items-center gap-2 group"
                    >
                      <Image
                        src={proxyImageUrl(item.team?.logo)}
                        alt={item.team.name}
                        width={20}
                        height={20}
                      />
                      <span className="font-semibold group-hover:text-[var(--brand-accent)] transition-colors whitespace-nowrap truncate">
                        {item.team.name}
                      </span>
                    </StyledLink>
                  </td>
                  <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
                    {stats.played}
                  </td>
                  <td className="p-2 text-center text-green-400 border-t border-gray-700/50">
                    {stats.win}
                  </td>
                  <td className="p-2 text-center text-yellow-400 border-t border-gray-700/50">
                    {stats.draw}
                  </td>
                  <td className="p-2 text-center text-red-400 border-t border-gray-700/50">
                    {stats.lose}
                  </td>
                  <td className="p-2 text-center text-text-muted border-t border-gray-700/50">
                    {item.goalsDiff}
                  </td>
                  <td className="p-2 text-center font-bold text-white border-t border-gray-700/50">
                    {item.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);
StandingsTable.displayName = "StandingsTable";

export default function LeagueStandingsWidget({
  initialStandings,
  leagueSeasons = [],
  currentSeason,
  onSeasonChange,
  isLoading,
  leagueId,
  leagueSlug,
}: LeagueStandingsWidgetProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<StandingsView>("all");
  const router = useRouter();

  const handleSeasonNavigation = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = e.target.value;
    if (leagueSlug) {
      router.push(`/football/standings/${leagueSlug}?season=${newSeason}`);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    appendDots: (dots: any) => (
      <div>
        <ul className="m-0 pt-3">{dots}</ul>
      </div>
    ),
  };

  return (
    <div className="bg-brand-secondary rounded-lg">
      <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ListOrdered size={22} /> {t("standings")}
        </h2>

        {leagueSeasons.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-muted">
              {t("season")}:
            </span>
            <select
              value={currentSeason}
              onChange={
                onSeasonChange
                  ? (e) => onSeasonChange(Number(e.target.value))
                  : handleSeasonNavigation
              }
              className="p-2 rounded bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple"
              disabled={isLoading}
            >
              {leagueSeasons.map((season) => (
                <option key={season} value={season}>
                  {season} - {season + 1}
                </option>
              ))}
            </select>
            {isLoading && onSeasonChange && (
              <Loader2 className="animate-spin text-brand-muted" />
            )}
          </div>
        )}
      </div>

      <div className="p-2 bg-brand-dark/30">
        <div className="flex items-center gap-1 bg-[var(--color-primary)] p-1 rounded-lg w-full max-w-xs mx-auto">
          <button
            onClick={() => setView("all")}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              view === "all"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("all")}
          </button>
          <button
            onClick={() => setView("home")}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              view === "home"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("home")}
          </button>
          <button
            onClick={() => setView("away")}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              view === "away"
                ? "bg-[var(--brand-accent)] text-white"
                : "text-text-muted hover:bg-gray-700"
            }`}
          >
            {t("away")}
          </button>
        </div>
      </div>

      <div className="relative">
        {isLoading && onSeasonChange && (
          <div className="absolute inset-0 bg-brand-secondary/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-brand-purple" />
          </div>
        )}
        {!initialStandings || initialStandings.length === 0 ? (
          <div className="text-center p-8">
            <Info size={32} className="mx-auto text-brand-muted mb-3" />
            <p className="font-semibold text-white">
              {t("standings_not_available")}
            </p>
          </div>
        ) : initialStandings.length > 1 ? (
          <Slider {...sliderSettings} className="p-4">
            {initialStandings.map((group, index) => (
              <div key={index}>
                <h3 className="text-center font-bold text-brand-light mb-3">
                  {group[0].group}
                </h3>
                <StandingsTable group={group} view={view} t={t} />
              </div>
            ))}
          </Slider>
        ) : (
          <StandingsTable group={initialStandings[0]} view={view} t={t} />
        )}
      </div>
    </div>
  );
}
