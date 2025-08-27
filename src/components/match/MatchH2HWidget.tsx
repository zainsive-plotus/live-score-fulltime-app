// ===== src/components/match/MatchH2HWidget.tsx =====

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, Info, Swords, Scale, ChevronDown } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "../StyledLink";

interface MatchH2HWidgetProps {
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  currentFixtureId: string;
  h2hSeoDescription: string;
}

const fetchH2HData = async (homeTeamId: number, awayTeamId: number) => {
  if (!homeTeamId || !awayTeamId) return [];
  const { data } = await axios.get(
    `/api/h2h?home=${homeTeamId}&away=${awayTeamId}`
  );
  return data || [];
};

const H2HSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden animate-pulse p-6">
    <div className="h-8 w-1/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-4 w-full bg-gray-600 rounded mb-6"></div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gray-700"></div>
        <div className="h-6 w-8 bg-gray-600 rounded"></div>
      </div>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="h-6 w-8 bg-gray-600 rounded"></div>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gray-700"></div>
        <div className="h-6 w-8 bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
      <div className="h-12 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);

const MatchRow = ({ match }: { match: any }) => (
  <StyledLink
    href={generateMatchSlug(
      match.teams.home,
      match.teams.away,
      match.fixture.id
    )}
    className="block bg-brand-dark/50 p-3 rounded-md hover:bg-brand-dark transition-colors duration-200 group"
  >
    <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
      <span className="font-semibold">{match.league.name}</span>
      <span className="flex items-center gap-1.5">
        <CalendarDays size={12} />
        {format(new Date(match.fixture.date), "dd MMM yyyy")}
      </span>
    </div>
    <div className="flex items-center justify-between text-base">
      <span
        className={`flex items-center gap-2 font-bold w-[40%] justify-start ${
          match.teams.home.winner ? "text-white" : "text-brand-light"
        }`}
      >
        <Image
          src={proxyImageUrl(match.teams.home.logo)}
          alt={match.teams.home.name}
          width={20}
          height={20}
        />
        <span className="truncate">{match.teams.home.name}</span>
      </span>
      <span className="px-3 py-1 bg-brand-dark rounded-md font-black text-white text-base">
        {match.goals.home} - {match.goals.away}
      </span>
      <span
        className={`flex items-center gap-2 font-bold w-[40%] justify-end ${
          match.teams.away.winner ? "text-white" : "text-brand-light"
        }`}
      >
        <span className="truncate text-right">{match.teams.away.name}</span>
        <Image
          src={proxyImageUrl(match.teams.away.logo)}
          alt={match.teams.away.name}
          width={20}
          height={20}
        />
      </span>
    </div>
  </StyledLink>
);

export default function MatchH2HWidget({
  teams,
  currentFixtureId,
  h2hSeoDescription,
}: MatchH2HWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const {
    data: h2h,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["h2hData", teams.home.id, teams.away.id],
    queryFn: () => fetchH2HData(teams.home.id, teams.away.id),
    staleTime: 1000 * 60 * 60,
    enabled: !!teams.home.id && !!teams.away.id,
  });

  const filteredH2H = useMemo(
    () =>
      h2h?.filter(
        (match: any) => match.fixture.id !== parseInt(currentFixtureId)
      ) || [],
    [h2h, currentFixtureId]
  );

  const headToHeadRecords = useMemo(() => {
    if (!filteredH2H || filteredH2H.length === 0) {
      return { homeWins: 0, awayWins: 0, draws: 0 };
    }
    return filteredH2H.reduce(
      (acc, match: any) => {
        if (match.teams.home.winner) {
          if (match.teams.home.id === teams.home.id) acc.homeWins++;
          else acc.awayWins++;
        } else if (match.teams.away.winner) {
          if (match.teams.away.id === teams.away.id) acc.awayWins++;
          else acc.homeWins++;
        } else {
          acc.draws++;
        }
        return acc;
      },
      { homeWins: 0, awayWins: 0, draws: 0 }
    );
  }, [filteredH2H, teams]);

  const displayedMatches = isExpanded ? filteredH2H : filteredH2H.slice(0, 5);

  if (isLoading) return <H2HSkeleton />;

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Swords size={22} className="text-[var(--brand-accent)]" />
          {t("head_to_head")}
        </h2>
        <p className="italic text-brand-muted leading-relaxed mb-6 text-sm">
          {h2hSeoDescription}
        </p>

        {isError || filteredH2H.length === 0 ? (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>{t("no_h2h_matches_found")}</p>
          </div>
        ) : (
          <>
            <div className="bg-brand-dark/50 p-4 rounded-lg mb-6">
              <p className="text-center text-sm font-bold text-brand-muted mb-4">
                {t("based_on_past_meetings", { count: filteredH2H.length })}
              </p>
              <div className="flex items-start justify-between">
                <div className="flex flex-col items-center gap-2 text-center w-1/3">
                  <Image
                    src={proxyImageUrl(teams.home.logo)}
                    alt={teams.home.name}
                    width={48}
                    height={48}
                  />
                  <span className="text-xs font-bold text-brand-muted">
                    {t("wins")}
                  </span>
                  <span className="font-black text-2xl text-white">
                    {headToHeadRecords.homeWins}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center pt-5">
                  <Scale size={32} className="text-brand-muted" />
                  <span className="text-xs font-bold text-brand-muted">
                    {t("draws")}
                  </span>
                  <span className="font-black text-2xl text-white">
                    {headToHeadRecords.draws}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center w-1/3">
                  <Image
                    src={proxyImageUrl(teams.away.logo)}
                    alt={teams.away.name}
                    width={48}
                    height={48}
                  />
                  <span className="text-xs font-bold text-brand-muted">
                    {t("wins")}
                  </span>
                  <span className="font-black text-2xl text-white">
                    {headToHeadRecords.awayWins}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-brand-muted tracking-wider">
                {t("recent_encounters")}
              </h3>
              {displayedMatches.map((match) => (
                <MatchRow key={match.fixture.id} match={match} />
              ))}
            </div>

            {filteredH2H.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text-muted hover:text-white hover:bg-brand-dark/50 transition-colors py-2 rounded-md"
                >
                  <span>
                    {isExpanded
                      ? t("show_less")
                      : t("show_all_count", { count: filteredH2H.length })}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
