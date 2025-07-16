import { notFound } from "next/navigation";
import axios from "axios";
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
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";
import Header from "@/components/Header";
import MatchHighlightsWidget from "@/components/match/MatchHighlightsWidget";
import LinkedNewsWidget from "@/components/match/LinkedNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const fetchMatchDetailsServer = async (fixtureId: string) => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Match Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined! Cannot fetch data."
    );
    return null;
  }
  const apiUrl = `${publicAppUrl}/api/match-details?fixture=${fixtureId}`;
  try {
    const { data } = await axios.get(apiUrl, { timeout: 15000 });
    return data;
  } catch (error: any) {
    console.error(
      `[Match Page Server] Failed to fetch initial match details (${apiUrl}):`,
      error.message
    );
    return null;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);

  if (!fixtureId) {
    return { title: t("not_found_title") };
  }

  const matchData = await fetchMatchDetailsServer(fixtureId);
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

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}${pagePath}`,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const { slug, locale } = await params;
  const fixtureId = getFixtureIdFromSlug(slug[0]);

  if (!fixtureId) {
    notFound();
  }

  const data = await fetchMatchDetailsServer(fixtureId);
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
            />
            <TeamFormWidget
              teamStats={analytics.awayTeamStats}
              team={awayTeam}
              location="Away"
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
          <CasinoPartnerWidget />
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
