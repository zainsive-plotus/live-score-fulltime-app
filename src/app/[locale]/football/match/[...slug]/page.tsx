// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import SidebarContent from "./SidebarContent";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// This function calls our single, robust, and now leaner API endpoint
const fetchMatchDetails = async (fixtureId: string, locale: string) => {
  const { data } = await axios.get(
    `/api/match-details?fixture=${fixtureId}&locale=${locale}`
  );
  return data;
};

const PageSkeleton = () => (
  <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start animate-pulse">
    <main className="lg:col-span-2 space-y-6">
      <div className="bg-brand-secondary h-64 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-secondary h-96 rounded-lg"></div>
        <div className="bg-brand-secondary h-96 rounded-lg"></div>
      </div>
      <div className="bg-brand-secondary h-80 rounded-lg"></div>
    </main>
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
      <RecentNewsWidgetSkeleton />
      <div className="aspect-video w-full rounded-lg bg-gray-700/50"></div>
      <div className="bg-brand-secondary h-80 rounded-lg"></div>
      <AdSlotWidgetSkeleton />
    </aside>
  </div>
);

export default function MatchDetailPageClient() {
  const params = useParams();
  const { t, locale } = useTranslation();

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const fixtureId = getFixtureIdFromSlug(slug || "");

  const {
    data: matchData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["matchDetailsClient", fixtureId, locale],
    queryFn: () => fetchMatchDetails(fixtureId!, locale!),
    enabled: !!fixtureId && !!locale,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <PageSkeleton />
      </div>
    );
  }

  if (isError || !matchData) {
    return (
      <div className="bg-brand-dark min-h-screen">
        <Header />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white">Match Not Found</h1>
          <p className="text-brand-muted mt-2">
            Could not load details for this match.
          </p>
        </div>
      </div>
    );
  }

  const {
    fixture: fixtureData,
    h2h,
    homeTeamStats,
    awayTeamStats,
    statistics,
    linkedNews,
  } = matchData;

  const { teams, fixture: fixtureDetails } = fixtureData;

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    fixtureDetails.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(fixtureDetails.status.short);

  const h2hSeoDescription = t("match_page_h2h_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const activitySeoDescription = t("match_page_activity_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const standingsSeoDescription = t("match_page_standings_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <main className="lg:col-span-2 space-y-6">
          <MatchHeader fixture={fixtureData} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamFormWidget
              teamStats={homeTeamStats}
              team={teams.home}
              location="Home"
              h2hData={h2h}
            />
            <TeamFormWidget
              teamStats={awayTeamStats}
              team={teams.away}
              location="Away"
              h2hData={h2h}
            />
          </div>
          <MatchLineupsWidget lineups={fixtureData.lineups} />
          <MatchH2HWidget
            h2h={h2h}
            teams={teams}
            currentFixtureId={fixtureId!}
            h2hSeoDescription={h2hSeoDescription}
          />
          {(isLive || isFinished) && (
            <MatchStatsWidget statistics={statistics} teams={teams} />
          )}
          <MatchActivityWidget
            initialEvents={fixtureData.events}
            fixtureId={fixtureId!}
            isLive={isLive}
            activitySeoDescription={activitySeoDescription}
          />
        </main>
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          <SidebarContent
            fixtureData={fixtureData}
            isLive={isLive}
            linkedNews={linkedNews}
            standingsSeoDescription={standingsSeoDescription}
          />
        </aside>
      </div>
    </div>
  );
}
