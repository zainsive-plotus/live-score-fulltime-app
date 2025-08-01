// ===== src/app/[locale]/football/standings/[...slug]/StandingsPageClient.tsx =====

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { ListOrdered, Loader2 } from "lucide-react";

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
  const { data } = await axios.get(
    `/api/standings?league=${leagueId}&season=${season}`
  );
  return data;
};

export default function StandingsPageClient({
  initialData,
  leagueId,
}: StandingsPageClientProps) {
  const { t } = useTranslation();
  const [selectedSeason, setSelectedSeason] = useState<number>(
    initialData.league.season
  );

  const {
    data: standingsData,
    isLoading,
    isFetching,
  } = useQuery<StandingsData>({
    queryKey: ["standingsDetail", leagueId, selectedSeason],
    queryFn: () => fetchStandingsData(leagueId, selectedSeason),
    initialData: initialData,
    keepPreviousData: true,
  });

  const league = standingsData?.league;
  const seoTitle = t("standings_detail_seo_title", {
    leagueName: league?.name,
    season: league?.season,
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

      {standingsData && (
        <LeagueStandingsWidget
          initialStandings={standingsData.standings}
          // ***** FIX IS HERE: Provide a default empty array *****
          leagueSeasons={standingsData.league?.seasons || []}
          currentSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          isLoading={isFetching} // Use isFetching to show loading state on refetches
        />
      )}
    </main>
  );
}
