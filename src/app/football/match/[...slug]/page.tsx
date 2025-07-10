// src/app/football/match/[...slug]/page.tsx
import { notFound } from "next/navigation";
import axios from "axios";
import type { Metadata } from "next";

// Import all the components
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

// Data fetching and metadata functions remain unchanged...
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
  params: { slug: string[] };
}): Promise<Metadata> {
  const slug = params.slug.join("/");
  const fixtureId = getFixtureIdFromSlug(slug);
  if (!fixtureId) {
    return { title: "Match Not Found" };
  }
  const matchData = await fetchMatchDetailsServer(fixtureId);
  if (!matchData || !matchData.fixture) {
    return { title: "Match Not Found" };
  }
  const homeTeamName = matchData.fixture.teams.home.name;
  const awayTeamName = matchData.fixture.teams.away.name;
  const leagueName = matchData.fixture.league.name;
  const pageTitle = `${homeTeamName} vs ${awayTeamName} - Live Score, Prediction & Match Stats | ${leagueName}`;
  const pageDescription = `Get ready for an electrifying clash between ${homeTeamName} and ${awayTeamName}, promising intense competition and thrilling moments for football fans! As these two teams step onto the pitch, all eyes will be on their tactical setups, player performances, and the strategies they bring to secure vital points.`;
  const canonicalUrl = `/football/match/${slug}`;
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: { title: pageTitle, description: pageDescription },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

// --- Main Page Component ---
export default async function MatchDetailPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const fixtureId = getFixtureIdFromSlug(slug);
  if (!fixtureId) {
    notFound();
  }

  const data = await fetchMatchDetailsServer(fixtureId);
  if (!data || !data.fixture) {
    notFound();
  }

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    data.fixture.fixture.status?.short
  );

  // --- THIS IS THE FIX ---
  // Added optional chaining (?.) to safely access .short
  const isFinished = ["FT", "AET", "PEN"].includes(
    data.fixture.fixture.status?.short
  );

  const { fixture, h2h, analytics, statistics } = data;
  const { home: homeTeam, away: awayTeam } = fixture.teams;

  // SEO descriptions remain the same
  const matchSeoDescription = `${homeTeam.name}, son haftalarda dikkat çekici galibiyetler ve sağlam savunma performanslarıyla bu maça güçlü bir formda geliyor. Saldırı hattı keskin, birçok fırsat yaratarak rakip hatalarından faydalanıyor. Bu arada, ${awayTeam.name}  de direncini gösterdi, erken aksaklıklardan geri döndü ve sıralamada istikrarlı bir şekilde yükselmeye başladı. Taraftarlar, her iki takımdan da yüksek enerji, agresif baskı ve yaratıcı oyunlar bekleyebilirler.`;
  const h2hSeoDescription = `Tarihsel olarak, ${homeTeam.name} ve ${awayTeam.name} arasındaki karşılaşmalar sıkı geçmiş, skor farkları dar ve son dakika dramalarıyla dolu olmuştur. Topa sahip olma yüzdeleri, kaleye atılan şutlar ve pas tamamlama oranları gibi detaylı istatistikler, her kritik anı takip edebilmeniz için gerçek zamanlı olarak güncellenecek.`;
  const standingsSeoDescription = `${homeTeam.name}'nın güçlü orta saha motoruna ve yıldız forvetine dikkat edin, her ikisi de savunmaları aşmak için hayati öneme sahip. Ancak, ${awayTeam.name} esas olarak güçlü stoper kombinasyonuna ve maçın seyrini her an değiştirebilecek hızlı kanat oyuncularına bağımlıdır.`;
  const activitySeoDescription = `Fanskor, stadyumdan canlı güncellemeler, gerçek zamanlı skorlar ve detaylı maç istatistikleri sunar. Taktik analizlerden gerçek zamanlı gol bildirimlerine kadar, tek bir önemli anı bile kaçırmayacaksınız. Sohbete katılın, tahminlerinizi paylaşın ve ${homeTeam.name} ile ${awayTeam.name} arasında üstünlük mücadelesinde heyecana kapılın.`;

  return (
    <div className="bg-brand-dark min-h-screen">
      <Header />
      <div className="container mx-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <main className="lg:col-span-2 space-y-6">
          <MatchHeader
            fixture={fixture}
            analytics={analytics}
            matchSeoDescription={matchSeoDescription}
          />
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
            awayTeamId={awayTeam.id}
            isLive={isLive}
            activitySeoDescription={activitySeoDescription}
          />
        </main>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 mt-8 lg:mt-0">
          {isLive && <LiveOddsWidget fixtureId={fixtureId} />}
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
