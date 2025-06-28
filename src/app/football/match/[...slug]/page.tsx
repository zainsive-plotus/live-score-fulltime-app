// src/app/football/match/[...slug]/page.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";

// Import all the components used on this page
import MatchHeader from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget"; // <-- IMPORT THE NEW WIDGET

// Data fetching functions and helpers remain unchanged
const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const fetchMatchDetails = async (fixtureId: string) => {
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data;
};

// Skeleton Component remains unchanged
const PageSkeleton = () => (
  <div className="animate-pulse container mx-auto p-4 md:p-8">
    <div className="h-48 w-full bg-brand-secondary rounded-lg mb-2"></div>
    <div className="h-10 w-full bg-brand-secondary rounded-b-lg mb-8"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      {/* Main Column Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
          <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
        </div>
        <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-64 w-full bg-brand-secondary rounded-lg"></div>
      </div>
      {/* Sidebar Column Skeleton */}
      <div className="lg:col-span-1 space-y-6">
        <div className="h-48 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-28 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-80 w-full bg-brand-secondary rounded-lg"></div>
        {/* Skeleton for TeamStandingsWidget */}
        <div className="h-64 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-40 w-full bg-brand-secondary rounded-lg"></div>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
export default function MatchDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug)
    ? params.slug.join("/")
    : (params.slug as string);
  const fixtureId = useMemo(() => getFixtureIdFromSlug(slug), [slug]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["matchDetails", fixtureId],
    queryFn: () => fetchMatchDetails(fixtureId!),
    enabled: !!fixtureId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const isLive = useMemo(() => {
    if (!data?.fixture?.status) return false;
    const statusShort = data.fixture.status.short;
    return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(statusShort);
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <PageSkeleton />
      </div>
    );
  }

  if (error || !data || !data.fixture) {
    return (
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400">Match Not Found</h1>
          <p className="text-brand-muted mt-2">
            Could not load the details for this match. It may have been removed
            or the ID is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const { fixture, h2h, analytics } = data;
  const { home: homeTeam, away: awayTeam } = fixture.teams;

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-2 md:p-4 lg:p-6 text-brand-light">
        <MatchHeader fixture={fixture} analytics={analytics} />
        <MatchStatusBanner fixture={fixture} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <main className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamFormWidget
                teamStats={analytics.homeTeamStats}
                team={homeTeam}
                location="Home"
              />
              <TeamFormWidget
                teamStats={analytics.awayTeamStats}
                team={awayTeam}
                location="Away"
              />
            </div>

            <MatchH2HWidget
              h2h={h2h}
              teams={fixture.teams}
              currentFixtureId={fixtureId!}
            />

            <MatchActivityWidget
              fixtureId={fixtureId!}
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
              homeTeamLogo={homeTeam.logo}
              awayTeamLogo={awayTeam.logo}
              isLive={isLive}
            />
          </main>

          <aside className="lg:col-span-1 space-y-6 sticky top-6">
            {isLive && <LiveOddsWidget fixtureId={fixtureId!} />}

            <TeamStandingsWidget
              leagueId={fixture.league.id}
              season={fixture.league.season}
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
            />

            <MatchPredictionWidget
              apiPrediction={analytics.prediction}
              customPrediction={analytics.customPrediction}
              bookmakerOdds={analytics.bookmakerOdds}
              teams={fixture.teams}
            />

            <MatchLineupsWidget lineups={fixture.lineups} />

            <AdSlotWidget location="match_sidebar" />
          </aside>
        </div>
      </div>
    </div>
  );
}
