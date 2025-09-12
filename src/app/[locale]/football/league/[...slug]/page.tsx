// ===== src/app/[locale]/football/league/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";
import { format } from "date-fns";

import Header from "@/components/Header";
import LeagueDetailView from "@/components/league-detail-view";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import LeagueSeoWidget from "@/components/league-detail-view/LeagueSeoWidget";
import LeagueTopScorersWidget from "@/components/league-detail-view/LeagueTopScorersWidget";
import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getLeaguesStaticData } from "@/lib/data/league-static";
import { getLeaguePageData } from "@/lib/data/league";
import { getNews } from "@/lib/data/news";
import { getHighlightsForLeague } from "@/lib/data/highlightly";

export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);
  const hreflangAlternates = await generateHreflangTags(
    "/football/league",
    slug.join("/"),
    locale
  );

  if (!leagueId) {
    return { title: t("not_found_title"), alternates: hreflangAlternates };
  }
  const allLeagues = await getLeaguesStaticData();
  const leagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);

  if (!leagueInfo) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: t("league_page_title", {
      leagueName: leagueInfo.name,
      countryName: leagueInfo.countryName,
    }),
    description: t("league_page_description", {
      leagueName: leagueInfo.name,
      countryName: leagueInfo.countryName,
    }),
    alternates: hreflangAlternates,
  };
}

export default async function LeaguePage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);
  if (!leagueId) notFound();

  const allLeagues = await getLeaguesStaticData();
  const staticLeagueInfo = allLeagues.find((l) => l.id.toString() === leagueId);
  if (!staticLeagueInfo) notFound();

  // Fetch all dynamic data in parallel for efficiency
  const [dynamicLeagueData, newsData, highlightsData] = await Promise.all([
    getLeaguePageData(leagueId),
    getNews({ locale, linkedLeagueId: parseInt(leagueId), limit: 12 }),
    getHighlightsForLeague(staticLeagueInfo.name),
  ]);

  if (!dynamicLeagueData) notFound();

  // Consolidate all fetched data into a single object for the client component
  const leagueData = {
    ...dynamicLeagueData,
    news: newsData.posts,
    highlights: highlightsData,
  };

  const { league, country, seasons, standings } = dynamicLeagueData;
  const currentSeason =
    seasons.find((s: any) => s.current === true) || seasons[0];
  const currentSeasonYear = currentSeason.year;

  const seoWidgetTitle = t("league_seo_widget_title", {
    leagueName: league.name,
  });
  const clubExamples =
    standings?.[0]?.slice(0, 3).map((t: any) => t.team.name) || [];
  const seoWidgetText = `
    <p>${t("league_seo_widget_about_text", {
      leagueName: league.name,
      country: country.name,
      clubCount: standings?.[0]?.length || "many",
      clubExample1: clubExamples[0] || "top clubs",
      clubExample2: clubExamples[1] || "",
      clubExample3: clubExamples[2] || "",
      startMonth: format(new Date(currentSeason.start), "MMMM"),
      endMonth: format(new Date(currentSeason.end), "MMMM"),
    })}</p>
  `;

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${league.name} ${currentSeasonYear}/${currentSeasonYear + 1}`,
      sport: "Soccer",
      location: { "@type": "Country", name: country.name },
      description: t("league_page_description", {
        leagueName: league.name,
        countryName: country.name,
      }),
      startDate: seasons.find((s: any) => s.year === currentSeasonYear)?.start,
      endDate: seasons.find((s: any) => s.year === currentSeasonYear)?.end,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("leagues"),
          item: `${BASE_URL}/${locale}/football/leagues`,
        },
        { "@type": "ListItem", position: 3, name: league.name },
      ],
    },
  ];

  return (
    <>
      <Script
        id="league-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start p-4 lg:py-6">
          <main className="min-w-0 space-y-8">
            <LeagueDetailView leagueData={leagueData} />
            <LeagueSeoWidget
              season={currentSeasonYear}
              leagueName={league.name}
              title={seoWidgetTitle}
              seoText={seoWidgetText}
            />
          </main>

          <aside className="hidden lg:block space-y-8 min-w-0">
            <LeagueTopScorersWidget
              leagueId={league.id}
              season={currentSeasonYear}
            />
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
