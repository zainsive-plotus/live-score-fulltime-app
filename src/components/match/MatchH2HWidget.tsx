// ===== src/components/match/MatchH2HWidget.tsx =====

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, Info } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { useTranslation } from "@/hooks/useTranslation";

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

export default function MatchH2HWidget({
  teams,
  currentFixtureId,
  h2hSeoDescription,
}: MatchH2HWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const {
    data: h2h,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["h2h", teams.home.id, teams.away.id],
    queryFn: () => fetchH2HData(teams.home.id, teams.away.id),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const filteredH2H = useMemo(
    () =>
      h2h?.filter(
        (match: any) => match.fixture.id !== parseInt(currentFixtureId)
      ) || [],
    [h2h, currentFixtureId]
  );

  const displayedH2H = showAll ? filteredH2H : filteredH2H.slice(0, 5);

  const headToHeadRecords = useMemo(() => {
    if (!filteredH2H || filteredH2H.length === 0) {
      return { homeWins: 0, awayWins: 0, draws: 0 };
    }

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    filteredH2H.forEach((match: any) => {
      if (match.fixture.status.short === "FT") {
        if (match.teams.home.winner) {
          if (match.teams.home.id === teams.home.id) homeWins++;
          else awayWins++;
        } else if (match.teams.away.winner) {
          if (match.teams.away.id === teams.away.id) awayWins++;
          else homeWins++;
        } else {
          draws++;
        }
      }
    });

    return { homeWins, awayWins, draws };
  }, [filteredH2H, teams]);

  if (isLoading) return <H2HSkeleton />;

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t("head_to_head")}
        </h2>
        <p className="italic text-[#a3a3a3] leading-relaxed mb-6">
          {h2hSeoDescription}
        </p>

        {isError || filteredH2H.length === 0 ? (
          <div className="text-center py-10 text-brand-muted">
            <Info size={32} className="mx-auto mb-3" />
            <p>{t("no_h2h_matches_found")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 text-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <Image
                  src={proxyImageUrl(teams.home.logo)}
                  alt={teams.home.name}
                  width={50}
                  height={50}
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.homeWins}
                </span>
                <span className="text-brand-muted text-sm">{t("wins")}</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.draws}
                </span>
                <span className="text-brand-muted text-sm">{t("draws")}</span>
              </div>
              <div className="flex flex-col items-center">
                <Image
                  src={proxyImageUrl(teams.away.logo)}
                  alt={teams.away.name}
                  width={50}
                  height={50}
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="text-white font-semibold text-lg">
                  {headToHeadRecords.awayWins}
                </span>
                <span className="text-brand-muted text-sm">{t("wins")}</span>
              </div>
            </div>

            <div className="space-y-3">
              {displayedH2H.map((match) => (
                <Link
                  key={match.fixture.id}
                  href={generateMatchSlug(
                    match.teams.home.name,
                    match.teams.away.name,
                    match.fixture.id
                  )}
                  className="block bg-gray-800/50 p-3 rounded-md hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-brand-muted" />
                      <span className="text-brand-muted">
                        {format(new Date(match.fixture.date), "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={proxyImageUrl(match.teams.home.logo)}
                          alt={match.teams.home.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-white font-medium">
                          {match.teams.home.name}
                        </span>
                        <span className="font-bold text-white text-lg">
                          {match.goals.home}
                        </span>
                      </div>
                      <span className="text-brand-muted"> - </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">
                          {match.goals.away}
                        </span>
                        <span className="text-white font-medium">
                          {match.teams.away.name}
                        </span>
                        <Image
                          src={proxyImageUrl(match.teams.away.logo)}
                          alt={match.teams.away.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredH2H.length > 5 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="bg-brand-purple text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {showAll
                    ? t("show_less")
                    : t("show_all_count", { count: filteredH2H.length })}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
