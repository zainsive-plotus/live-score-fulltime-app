// ===== src/app/[locale]/football/standings/[...slug]/StandingsPageClient.tsx =====

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import { ListOrdered, Loader2 } from "lucide-react";

// The API response type needs to be defined here for useQuery
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

  const { data: standingsData, isLoading } = useQuery<StandingsData>({
    queryKey: ["standingsDetail", leagueId, selectedSeason],
    queryFn: () => fetchStandingsData(leagueId, selectedSeason),
    // Use the server-fetched data as the initial data for the current season
    initialData: initialData,
    // Keep previous data while fetching new season to prevent UI flicker
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
            {/* Season Selector */}
            {league && league.seasons && (
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="mt-2 p-1 text-sm rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
              >
                {league.seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <p className="text-brand-muted leading-relaxed">{seoDescription}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="animate-spin" size={32} />
        </div>
      )}

      {!isLoading && standingsData && (
        <LeagueStandingsWidget
          standings={standingsData.standings}
          league={standingsData.league}
        />
      )}
    </main>
  );
}
