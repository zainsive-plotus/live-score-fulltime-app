// ===== src/app/[locale]/football/match/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MatchHeader } from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget";
import Header from "@/components/Header";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
// ***** FIX: Import the shared data fetching function *****
import { fetchAllDataForFixture } from "@/lib/data/match";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// The old fetchMatchDetailsServer function is no longer needed and can be removed.

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);

  if (!fixtureId) {
    return { title: t("not_found_title") };
  }

  // ***** FIX: Call the shared function directly *****
  const matchData = await fetchAllDataForFixture(fixtureId).catch(() => null);
  if (!matchData || !matchData.fixture) {
    return { title: t("not_found_title") };
  }

  const { home: homeTeam, away: awayTeam } = matchData.fixture.teams;
  const pagePath = `/football/match/${slug.join("/")}`;
  const hreflangAlternates = await generateHreflangTags(pagePath, locale);

  const pageTitle = t("match_page_title", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: matchData.fixture.league.name,
  });
  const pageDescription = t("match_page_description", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
    leagueName: matchData.fixture.league.name,
  });
  const ogImageUrl = `${BASE_URL}/og-image.jpg`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: hreflangAlternates.canonical,
      siteName: "Fan Skor",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: pageTitle }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const fixtureId = getFixtureIdFromSlug(slug[0]);

  if (!fixtureId) {
    notFound();
  }

  // ***** FIX: Call the shared function directly *****
  const data = await fetchAllDataForFixture(fixtureId).catch(() => null);
  if (!data || !data.fixture) {
    notFound();
  }

  const t = await getI18n(locale);

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    data.fixture.fixture.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(
    data.fixture.fixture.status?.short
  );

  const { fixture, h2h, analytics, statistics } = data;
  const { home: homeTeam, away: awayTeam } = fixture.teams;

  const h2hSeoDescription = t("match_page_h2h_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });
  const standingsSeoDescription = t("match_page_standings_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });
  const activitySeoDescription = t("match_page_activity_seo_text", {
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  });

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <main className="lg:col-span-2 space-y-6">
          <MatchHeader fixture={fixture} analytics={analytics} />
          <MatchStatusBanner fixture={fixture} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamFormWidget
              teamStats={analytics.homeTeamStats}
              team={homeTeam}
              location="Home"
              h2hData={h2h}
            />
            <TeamFormWidget
              teamStats={analytics.awayTeamStats}
              team={awayTeam}
              location="Away"
              h2hData={h2h}
            />
          </div>
          <MatchLineupsWidget lineups={fixture.lineups} />
          <MatchH2HWidget
            h2h={h2h}
            teams={fixture.teams}
            currentFixtureId={fixtureId}
            h2hSeoDescription={h2hSeoDescription}
          />
          {(isLive || isFinished) && (
            <MatchStatsWidget statistics={statistics} teams={fixture.teams} />
          )}
          <MatchActivityWidget
            fixtureId={fixtureId}
            homeTeamId={homeTeam.id}
            isLive={isLive}
            activitySeoDescription={activitySeoDescription}
          />
        </main>
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          {isLive && <LiveOddsWidget fixtureId={fixtureId} />}
          <LinkedNewsWidget fixtureId={fixture.fixture.id} />
          <MatchHighlightsWidget fixtureId={fixtureId} />
          <TeamStandingsWidget
            leagueId={fixture.league.id}
            season={fixture.league.season}
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            standingsSeoDescription={standingsSeoDescription}
          />
          <MatchPredictionWidget
            apiPrediction={null}
            customPrediction={analytics.customPrediction}
            bookmakerOdds={analytics.bookmakerOdds}
            teams={fixture.teams}
          />
          <AdSlotWidget location="match_sidebar" />
        </aside>
      </div>
    </div>
  );
}
