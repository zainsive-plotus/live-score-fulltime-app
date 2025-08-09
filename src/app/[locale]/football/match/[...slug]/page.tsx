// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFixture, getStatistics } from "@/lib/data/match"; // Only fast queries
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchFormationWidget";
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

// Metadata generation remains on the server for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) return { title: t("not_found_title") };

  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) return { title: t("not_found_title") };

  const { teams, league } = fixtureData;
  const pagePath = `/football/match/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(
    "/football/match",
    slug.join("/"),
    locale
  );

  const pageTitle = t("match_page_title", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });
  const pageDescription = t("match_page_description", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

// Skeletons for Suspense Boundaries
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
const FormationSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 md:p-6 animate-pulse h-[600px]"></div>
);
const SidebarSkeleton = () => (
  <div className="space-y-6">
    <RecentNewsWidgetSkeleton />
    <div className="aspect-video w-full rounded-lg bg-gray-700/50 animate-pulse"></div>
    <div className="bg-brand-secondary rounded-lg h-80 animate-pulse"></div>
    <AdSlotWidgetSkeleton />
  </div>
);

// This is now a Server Component
export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) notFound();

  // The page now fetches ONLY the most essential data on the server.
  const fixtureData = await getFixture(fixtureId);
  if (!fixtureData) notFound();

  // We can pre-fetch stats as it's usually fast and part of the core view
  const statistics = await getStatistics(fixtureId);

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

          <Suspense fallback={<FormationSkeleton />}>
            <MatchFormationWidget fixtureId={fixtureId} />
          </Suspense>

          <MatchLineupsWidget lineups={fixtureData.lineups} />

          <Suspense fallback={<H2HContentSkeleton />}>
            <MatchH2HWidget
              teams={teams}
              currentFixtureId={fixtureId}
              h2hSeoDescription={h2hSeoDescription}
            />
          </Suspense>

          {(isLive || isFinished) && (
            <MatchStatsWidget statistics={statistics || []} teams={teams} />
          )}

          <MatchActivityWidget
            fixtureId={fixtureId}
            isLive={isLive}
            homeTeamId={teams.home.id}
            activitySeoDescription={activitySeoDescription}
          />
        </main>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarContent
              fixtureData={fixtureData}
              isLive={isLive}
              standingsSeoDescription={standingsSeoDescription}
            />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
