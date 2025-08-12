// ===== src/app/[locale]/football/standings/[...slug]/StandingsPageClient.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { ListOrdered } from "lucide-react";

interface StandingsData {
  league: {
    id: number;
    name: string;
    logo: string;
    type: string;
    season: number;
    seasons: number[];
    href: string;
    country: string;
  };
  standings: any[][];
  leagueStats: any;
  topScorer: any;
}

interface StandingsPageClientProps {
  initialData: StandingsData;
  leagueId: string;
}

const fetchStandingsData = async (
  leagueId: string,
  season: number
): Promise<StandingsData> => {
  const params = new URLSearchParams({
    league: leagueId,
    season: season.toString(),
  });
  // Date logic removed for simplicity as per previous request
  const { data } = await axios.get(`/api/standings?${params.toString()}`);
  return data;
};

export default function StandingsPageClient({
  initialData,
  leagueId,
}: StandingsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getSeasonFromUrl = () => {
    const seasonParam = searchParams.get("season");
    return seasonParam ? parseInt(seasonParam) : initialData.league.season;
  };

  const [selectedSeason, setSelectedSeason] =
    useState<number>(getSeasonFromUrl);

  useEffect(() => {
    setSelectedSeason(getSeasonFromUrl());
  }, [searchParams]);

  // --- THIS IS THE FIX ---
  // The query is now simplified. We let react-query handle the data fetching
  // and use the `placeholderData` option to prevent flashes of missing content.
  const { data: standingsData, isFetching } = useQuery<StandingsData>({
    queryKey: ["standingsDetail", leagueId, selectedSeason],
    queryFn: () => fetchStandingsData(leagueId, selectedSeason),
    // Use placeholderData to keep showing the old data while the new data loads.
    // This is the correct way to prevent UI jumps.
    placeholderData: (previousData) => previousData,
    // initialData and keepPreviousData are removed as they were causing the issue.
  });
  // --- END OF FIX ---

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("season", season.toString());
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`, { scroll: false });
  };

  const displayData = standingsData || initialData;
  const league = displayData.league;
  const seoTitle = t("standings_detail_seo_title", {
    leagueName: league?.name,
    season: selectedSeason,
  });
  const seoDescription = t("standings_detail_seo_description", {
    leagueName: league?.name,
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
        <p className="text-brand-muted leading-relaxed">{seoDescription}</p>
      </div>

      <LeagueStandingsWidget
        initialStandings={displayData.standings}
        leagueSeasons={initialData.league?.seasons || []}
        currentSeason={selectedSeason}
        onSeasonChange={handleSeasonChange}
        isLoading={isFetching}
      />
    </main>
  );
}
