// src/app/football/match/[...slug]/page.tsx
// This is now a Server Component. No "use client" directive here.

import { notFound } from "next/navigation";
import axios from "axios";
import type { Metadata } from "next";

// Removed server-side i18n imports
// import { getDictionary } from '@/i18n.server';
// import { Locale } from '@/i18n.config';

// Import all the components used on this page
import Header from "@/components/Header";
import MatchHeader from "@/components/match/MatchHeader";
import MatchStatusBanner from "@/components/match/MatchStatusBanner";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchLineupsWidget from "@/components/match/MatchLineupsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import LiveOddsWidget from "@/components/match/LiveOddsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import TeamStandingsWidget from "@/components/match/TeamStandingsWidget";
import CasinoPartner from "@/models/CasinoPartner";
import CasinoPartnerWidget from "@/components/CasinoPartnerWidget";

// --- Helper Functions (callable by server components) ---
const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// Server-side data fetching for initial page render and metadata
const fetchMatchDetailsServer = async (fixtureId: string) => {
  const publicAppUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (!publicAppUrl) {
    console.error(
      "[Match Page Server] NEXT_PUBLIC_PUBLIC_APP_URL is not defined! Cannot fetch data."
    );
    return null;
  }
  const apiUrl = `${publicAppUrl}/api/match-details?fixture=${fixtureId}`;
  console.log(
    `[Match Page Server] Attempting to fetch initial match data from internal API: ${apiUrl}`
  );

  try {
    const { data } = await axios.get(apiUrl, { timeout: 10000 });
    console.log(
      `[Match Page Server] Successfully fetched initial match data for fixture ID ${fixtureId}.`
    );
    return data;
  } catch (error: any) {
    console.error(
      `[Match Page Server] Failed to fetch initial match details (${apiUrl}):`,
      error.message
    );
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "[Match Page Server] API Response Error (Status, Data):",
        error.response.status,
        error.response.data
      );
    }
    return null;
  }
};

// Skeleton Component (remains unchanged)
const PageSkeleton = () => (
  <div className="animate-pulse container mx-auto p-4 md:p-8">
    <div className="h-48 w-full bg-brand-secondary rounded-lg mb-2"></div>
    <div className="h-10 w-full bg-brand-secondary rounded-b-lg mb-8"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
          <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
        </div>
        <div className="h-96 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-64 w-full bg-brand-secondary rounded-lg"></div>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <div className="h-48 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-28 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-80 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-64 w-full bg-brand-secondary rounded-lg"></div>
        <div className="h-40 w-full bg-brand-secondary rounded-lg"></div>
      </div>
    </div>
  </div>
);

// --- DYNAMIC METADATA GENERATION ---
export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }; // Removed locale from params
}): Promise<Metadata> {
  console.log(
    `[generateMetadata] Function called for params: ${JSON.stringify(
      params.slug
    )}`
  );

  const slug = params.slug.join("/");
  const fixtureId = getFixtureIdFromSlug(slug);

  if (!fixtureId) {
    console.warn(
      "[generateMetadata] No valid fixtureId obtained from slug. Returning default metadata."
    );
    return {
      title: "Match Not Found",
      description: "Details for this football match are not available.",
    };
  }

  const matchData = await fetchMatchDetailsServer(fixtureId);

  if (!matchData || !matchData.fixture) {
    console.warn(
      `[generateMetadata] Data for fixture ID ${fixtureId} is missing or incomplete. Returning default metadata.`
    );
    return {
      title: "Match Not Found",
      description: "Details for this football match are not available.",
    };
  }

  const homeTeamName = matchData.fixture.teams.home.name;
  const awayTeamName = matchData.fixture.teams.away.name;
  const leagueName = matchData.fixture.league.name;

  // Removed getDictionary call
  // const dict = await getDictionary(params.locale);

  const pageTitle = `${homeTeamName} vs ${awayTeamName} - Live Score, Prediction & Match Stats | ${leagueName}`;

  // Reverted to static description, or you can add client-side translation if desired.
  // For metadata, static is safer if not using server-side i18n directly.
  const pageDescription = `Get ready for an electrifying clash between ${homeTeamName} and ${awayTeamName}, promising intense competition and thrilling moments for football fans! As these two teams step onto the pitch, all eyes will be on their tactical setups, player performances, and the strategies they bring to secure vital points.`;

  // Construct Canonical URL: metadataBase from root layout + relative path
  const canonicalUrl = `/football/match/${slug}`;
  console.log(
    `[generateMetadata] Constructed Canonical URL (relative): ${canonicalUrl}`
  );

  const metadataResult: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };

  console.log(
    "[generateMetadata] Successfully generated metadata. Returning result."
  );
  return metadataResult;
}

// --- Main Page Component (Server Component) ---
export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[] }; // Removed locale from params
}) {
  console.log(
    `[Match Page Server] Rendering MatchDetailPage for slug: ${JSON.stringify(
      params.slug
    )}`
  );

  const slug = params.slug.join("/");
  const fixtureId = getFixtureIdFromSlug(slug);

  if (!fixtureId) {
    console.error(
      "[Match Page Server] No fixtureId available, calling notFound()."
    );
    notFound();
  }

  // Fetch initial data on the server
  const data = await fetchMatchDetailsServer(fixtureId);

  // Handle cases where data fetching fails or fixture is not found
  if (!data || !data.fixture) {
    console.error(
      `[Match Page Server] Initial data fetch failed or fixture not found for ID ${fixtureId}, calling notFound().`
    );
    notFound();
  }

  // Removed getDictionary call
  // const dict = await getDictionary(params.locale);

  // Determine if match is live (server-side, for initial render)
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    data.fixture.status?.short
  );

  const { fixture, h2h, analytics } = data;
  const { home: homeTeam, away: awayTeam } = fixture.teams;

  // --- Generate SEO Optimization Text for display on page ---
  // Pass team names for client-side translation in MatchHeader
  const matchSeoDescription = `${homeTeam.name}, son haftalarda dikkat çekici galibiyetler ve sağlam savunma performanslarıyla bu maça güçlü bir formda geliyor. Saldırı hattı keskin, birçok fırsat yaratarak rakip hatalarından faydalanıyor. Bu arada, ${awayTeam.name}  de direncini gösterdi, erken aksaklıklardan geri döndü ve sıralamada istikrarlı bir şekilde yükselmeye başladı. Taraftarlar, her iki takımdan da yüksek enerji, agresif baskı ve yaratıcı oyunlar bekleyebilirler.`;

  const h2hSeoDescription = `Tarihsel olarak, ${homeTeam.name} ve ${awayTeam.name} arasındaki karşılaşmalar sıkı geçmiş, skor farkları dar ve son dakika dramalarıyla dolu olmuştur. Topa sahip olma yüzdeleri, kaleye atılan şutlar ve pas tamamlama oranları gibi detaylı istatistikler, her kritik anı takip edebilmeniz için gerçek zamanlı olarak güncellenecek.`;

  // --- Generate SEO Optimization Text for Standings widget ---
  const standingsSeoDescription =
    `${homeTeam.name}'nın güçlü orta saha motoruna ve yıldız forvetine dikkat edin, her ikisi de savunmaları aşmak için hayati öneme sahip. ` +
    `Ancak, ${awayTeam.name} esas olarak güçlü stoper kombinasyonuna ve maçın seyrini her an değiştirebilecek hızlı kanat oyuncularına bağımlıdır.`;

  const activitySeoDescription = `Fanskor, stadyumdan canlı güncellemeler, gerçek zamanlı skorlar ve detaylı maç istatistikleri sunar. Taktik analizlerden gerçek zamanlı gol bildirimlerine kadar, tek bir önemli anı bile kaçırmayacaksınız. Sohbete katılın, tahminlerinizi paylaşın ve ${homeTeam.name} ile ${awayTeam.name} arasında üstünlük mücadelesinde heyecana kapılın.`;

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-2 md:p-4 lg:p-6 text-brand-light">
        {/* Pass team names to MatchHeader for client-side translation */}
        <MatchHeader
          fixture={fixture}
          analytics={analytics}
          matchSeoDescription={matchSeoDescription} // Changed prop name
        />
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
              h2hSeoDescription={h2hSeoDescription}
            />

            <MatchActivityWidget
              fixtureId={fixtureId!}
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
              homeTeamLogo={homeTeam.logo}
              awayTeamLogo={awayTeam.logo}
              isLive={isLive}
              activitySeoDescription={activitySeoDescription}
            />
          </main>

          <aside className="lg:col-span-1 space-y-6 sticky top-6">
            {isLive && <LiveOddsWidget fixtureId={fixtureId!} />}

            <CasinoPartnerWidget />

            <TeamStandingsWidget
              leagueId={fixture.league.id}
              season={fixture.league.season}
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
              standingsSeoDescription={standingsSeoDescription}
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
