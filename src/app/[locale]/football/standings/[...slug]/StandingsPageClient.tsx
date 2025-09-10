// ===== src/app/[locale]/football/standings/[...slug]/StandingsPageClient.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { ListOrdered } from "lucide-react";
import type { StaticLeague } from "@/lib/data/league-static";

// This interface now only expects the static, basic league info
interface StandingsPageClientProps {
  staticLeagueInfo: StaticLeague;
  initialSeason: string;
}

// The data fetched on the client will be more comprehensive
interface StandingsData {
  league: {
    seasons: number[];
    [key: string]: any; // Other properties
  };
  standings: any[][];
}

// Updated fetcher to get standings data for a specific season
const fetchStandingsForSeason = async (
  leagueId: string,
  season: number
): Promise<StandingsData> => {
  const params = new URLSearchParams({
    league: leagueId,
    season: season.toString(),
  });
  const { data } = await axios.get(`/api/standings?${params.toString()}`);
  return data;
};

export default function StandingsPageClient({
  staticLeagueInfo,
  initialSeason,
}: StandingsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const leagueId = staticLeagueInfo.id.toString();

  const getSeasonFromUrl = () => {
    const seasonParam = searchParams.get("season");
    return seasonParam ? parseInt(seasonParam) : parseInt(initialSeason);
  };

  const [selectedSeason, setSelectedSeason] =
    useState<number>(getSeasonFromUrl);

  useEffect(() => {
    setSelectedSeason(getSeasonFromUrl());
  }, [searchParams, initialSeason]);

  // useQuery now fetches the dynamic standings data
  const {
    data: standingsData,
    isFetching,
    isError,
  } = useQuery<StandingsData>({
    queryKey: ["standingsDetail", leagueId, selectedSeason],
    queryFn: () => fetchStandingsForSeason(leagueId, selectedSeason),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("season", season.toString());
    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const seoTitle = t("standings_detail_seo_title", {
    leagueName: staticLeagueInfo.name,
    season: selectedSeason,
  });

  return (
    <main className="min-w-0 space-y-6">
      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-brand-purple/10 rounded-lg">
            <ListOrdered className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">{seoTitle}</h1>
          </div>
        </div>
        <p className="text-brand-muted leading-relaxed">
          {t("standings_detail_page_description", {
            leagueName: staticLeagueInfo.name,
          })}
        </p>
      </div>

      <LeagueStandingsWidget
        // Use fetched data if available, otherwise pass empty array to show skeleton
        initialStandings={standingsData?.standings || []}
        leagueSeasons={standingsData?.league?.seasons || [selectedSeason]}
        currentSeason={selectedSeason}
        onSeasonChange={handleSeasonChange}
        isLoading={isFetching} // Use isFetching to show loading state on season change
        leagueId={parseInt(leagueId)}
        leagueSlug={staticLeagueInfo.href.split("/").pop()}
      />
    </main>
  );
}
