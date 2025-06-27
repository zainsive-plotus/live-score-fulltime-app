// src/app/football/match/[...slug]/page.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";

// Import all the separated components for the page
import MatchHeader from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import MatchEventsWidget from "@/components/match/MatchEventsWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchAnalyticsWidget from "@/components/match/MatchAnalyticsWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import BettingPromotionWidget from "@/components/BettingPromotionWidget";
import AdSlotWidget from "@/components/AdSlotWidget"; // The newly added Ad Widget

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  // Check if the last part is a number
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// The fetcher now only ever uses the fixture ID
const fetchMatchDetails = async (fixtureId: string) => {
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
  return data;
};

// --- Skeleton Component for Initial Loading ---
const PageSkeleton = () => (
  <div className="animate-pulse container mx-auto p-4 md:p-8">
    {/* Skeleton for MatchHeader */}
    <div className="h-48 w-full bg-brand-secondary rounded-lg mb-2"></div>
    {/* Skeleton for MatchStatusBanner */}
    <div className="h-10 w-full bg-brand-secondary rounded-b-lg mb-8"></div>
    {/* Skeleton for the main content grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <div className="h-40 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-80 w-full bg-brand-secondary rounded-lg"></div>
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
    staleTime: 1000 * 60, // Refetch data every 60 seconds
    refetchOnWindowFocus: true,
  });

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

  const { fixture, events, statistics, h2h, analytics } = data;

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-2 md:p-4 lg:p-6 text-brand-light">
        {/* Header components */}
        <MatchHeader fixture={fixture} />
        <MatchStatusBanner fixture={fixture} />

        {/* --- RESPONSIVE WIDGET GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Content Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <MatchEventsWidget events={events} teams={fixture.teams} />
            <MatchStatsWidget statistics={statistics} teams={fixture.teams} />
            <MatchH2HWidget
              h2h={h2h}
              teams={fixture.teams}
              currentFixtureId={fixtureId!}
            />
          </div>

          {/* Sidebar Column (1/3 width on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            <AdSlotWidget location="match_sidebar" />
            <MatchAnalyticsWidget analytics={analytics} />
            <MatchLineupsWidget lineups={fixture.lineups} />
            <BettingPromotionWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
