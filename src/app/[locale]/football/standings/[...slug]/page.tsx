import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import axios from "axios";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import LeagueDetailWidget from "@/components/directory/LeagueDetailWidget";
import StandingsPageClient from "./StandingsPageClient";
import Script from "next/script";
import { WithContext, SportsEvent, BreadcrumbList } from "schema-dts";
import LeagueStandingsSeoWidget from "@/components/league-detail-view/LeagueStandingsSeoWidget";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getLeagueIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

async function getInitialStandingsData(leagueId: string, season: string) {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/standings?league=${leagueId}&season=${season}`
    );
    return data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    return { title: t("not_found_title") };
  }

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();
  const initialData = await getInitialStandingsData(leagueId, season);

  if (!initialData || !initialData.league) {
    return { title: t("not_found_title") };
  }

  const { league } = initialData;
  const hreflangAlternates = await generateHreflangTags(
    "/football/standings",
    slug.join("/"),
    locale
  );

  const pageTitle = t("standings_detail_page_title", {
    leagueName: league.name,
    season: league.season,
  });
  const pageDescription = t("standings_detail_page_description", {
    leagueName: league.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

export default async function LeagueStandingsPage({
  params,
  searchParams,
}: {
  params: { slug: string[]; locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const leagueId = getLeagueIdFromSlug(slug[0]);

  if (!leagueId) {
    notFound();
  }

  const season =
    (searchParams?.season as string) || new Date().getFullYear().toString();
  const initialData = await getInitialStandingsData(leagueId, season);

  if (!initialData || !initialData.league) {
    notFound();
  }

  const { league, standings } = initialData;

  // ** NEW: Fetch the specific SEO text for this page **
  const seoText = t("standings_detail_seo_description", {
    leagueName: league.name,
  });

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${league.name} ${league.season}`,
      sport: "Soccer",
      location: { "@type": "Country", name: league.country },
      competitor:
        standings?.[0]?.map((teamStanding: any) => ({
          "@type": "SportsTeam",
          name: teamStanding.team.name,
        })) || [],
      description: t("standings_detail_page_description", {
        leagueName: league.name,
      }),
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
          name: t("standings_hub_title"),
          item: `${BASE_URL}/${locale}/football/standings`,
        },
        { "@type": "ListItem", position: 3, name: league.name },
      ],
    },
  ];

  return (
    <>
      <Script
        id="standings-detail-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          {/* ** NEW: Pass the seoText as a prop to the client component ** */}
          <div>
            <StandingsPageClient
              initialData={initialData}
              leagueId={leagueId}
            />
            <LeagueStandingsSeoWidget
              locale={locale}
              leagueId={league.id}
              leagueName={league.name}
              season={league.season}
            />
          </div>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
            <LeagueDetailWidget
              league={initialData.league}
              leagueStats={initialData.leagueStats}
              topScorer={initialData.topScorer}
            />
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
