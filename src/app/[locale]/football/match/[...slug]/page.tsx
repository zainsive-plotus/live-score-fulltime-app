// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import { Suspense } from "react";
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
import MatchFormationWidget from "@/components/match/MatchFormationWidget";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const fetchMatchDetails = async (fixtureId: string) => {
  const { data } = await axios.get(`/api/match-details?fixture=${fixtureId}`);
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

const TeamFormContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
  </div>
);
const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6"></div>
);
const StatsContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-80 animate-pulse p-6"></div>
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
    queryKey: ["matchDetailsClient", fixtureId],
    queryFn: () => fetchMatchDetails(fixtureId!),
    enabled: !!fixtureId,
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

  const { fixture: fixtureData, statistics, linkedNews } = matchData;

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

          <Suspense fallback={<TeamFormContentSkeleton />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamFormWidget
                team={teams.home}
                location="Home"
                fixtureData={fixtureData}
              />
              <TeamFormWidget
                team={teams.away}
                location="Away"
                fixtureData={fixtureData}
              />
            </div>
          </Suspense>

          {(isLive || isFinished) && (
            <MatchStatsWidget statistics={statistics} teams={teams} />
          )}

          <MatchFormationWidget fixtureId={fixtureId!} />

          <Suspense fallback={<H2HContentSkeleton />}>
            <MatchH2HWidget
              teams={teams}
              currentFixtureId={fixtureId!}
              h2hSeoDescription={h2hSeoDescription}
            />
          </Suspense>

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
