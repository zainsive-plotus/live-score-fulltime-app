// ===== src/app/[locale]/football/team/[...slug]/page.tsx =====

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import {
  getTeamInfo,
  getTeamSquad,
  getTeamFixtures,
  getTeamStandings,
} from "@/lib/data/team";

// Component Imports
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamHeader from "@/components/team/TeamHeader";
import TeamSquadWidget from "@/components/team/TeamSquadWidget";
import TeamFixturesWidget from "@/components/team/TeamFixturesWidget";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import TeamFormWidgetSidebar from "@/components/team/TeamFormWidgetSidebar";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import TeamSeoWidget from "@/components/team/TeamSeoWidget";
// import LeagueStandingsWidget from "@/components/league-detail-view/LeagueStandingsWidget";
import Script from "next/script";
import { WithContext, SportsTeam, BreadcrumbList } from "schema-dts";
import axios from "axios"; // ADDED

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

async function getSeoContent(
  teamId: string,
  language: string
): Promise<string | null> {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/seo-content/team-details?teamId=${teamId}&language=${language}`
    );
    return data.seoText || null;
  } catch (error) {
    // It's normal for content not to be found (404), so we return null gracefully.
    console.log(
      `[Team Page] No generated SEO content found for team ${teamId} in ${language}.`
    );
    return null;
  }
}

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// --- Metadata Generation ---
export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);
  const hreflangAlternates = await generateHreflangTags(
    "/football/team",
    slug.join("/"),
    locale
  );

  if (!teamId)
    return { title: t("not_found_title"), alternates: hreflangAlternates };

  const teamInfo = await getTeamInfo(teamId);
  if (!teamInfo)
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };

  const { team } = teamInfo;
  const pageTitle = t("team_page_meta_title", { teamName: team.name });
  const pageDescription = t("team_page_meta_description", {
    teamName: team.name,
  });

  // Determine the image URL for Open Graph, with a fallback
  const imageUrl = team.logo || `${BASE_URL}/og-image.jpg`;

  return {
    // title: pageTitle,
    // description: pageDescription,
    alternates: hreflangAlternates,

    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: hreflangAlternates.canonical, // Use the generated canonical URL
      siteName: "Fanskor",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 256, // Specify dimensions, even if they are approximate
          height: 256,
          alt: `${team.name} logo`,
        },
      ],
    },
    // It's also good practice to add Twitter-specific tags
    twitter: {
      card: "summary",
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
    },
  };
}

// --- Skeletons ---
const StandingsWidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-96 animate-pulse p-6"></div>
);
const TeamFixturesSkeleton = () => (
  <div className="h-96 bg-brand-secondary rounded-xl animate-pulse"></div>
);
const TeamSquadSkeleton = () => (
  <div className="h-96 bg-brand-secondary rounded-lg animate-pulse"></div>
);
const SidebarItemSkeleton = () => (
  <div className="h-40 bg-brand-secondary rounded-lg animate-pulse"></div>
);

// --- Data Fetching Wrapper Components for Suspense ---
async function MainContent({
  teamId,
  locale,
  seoText,
}: {
  teamId: string;
  locale: string;
  seoText: string | null; // Can be null if not found
}) {
  const t = await getI18n(locale);
  const teamInfo = await getTeamInfo(teamId);
  if (!teamInfo) notFound();

  const { team } = teamInfo;
  const standingsData = getTeamStandings(teamId);

  const squadData = getTeamSquad(teamId);

  const primaryLeagueStandings = (await standingsData)?.[0]?.league?.standings;
  const primaryLeagueInfo = (await standingsData)?.[0]?.league;

  const seoWidgetTitle = t("team_seo_widget_title", { teamName: team.name });
  const finalSeoText =
    seoText || t("team_page_seo_text", { teamName: team.name });

  return (
    <main className="min-w-0 space-y-8">
      {primaryLeagueStandings && primaryLeagueInfo && (
        <Suspense fallback={<StandingsWidgetSkeleton />}>
          {/* <LeagueStandingsWidget
            initialStandings={[primaryLeagueStandings]}
            leagueSeasons={[primaryLeagueInfo.season]}
            currentSeason={primaryLeagueInfo.season}
            isLoading={false}
            leagueId={primaryLeagueInfo.id}
            homeTeamId={team.id}
            hideSeasonDropdown={true}
          /> */}
        </Suspense>
      )}

      <Suspense fallback={<TeamFixturesSkeleton />}>
        <TeamFixturesWidget teamId={team.id} />
      </Suspense>

      <Suspense fallback={<TeamSquadSkeleton />}>
        <TeamSquadWidget squad={await squadData} />
      </Suspense>

      <TeamSeoWidget title={seoWidgetTitle} seoText={finalSeoText} />
    </main>
  );
}

async function SidebarContent({ teamId }: { teamId: string }) {
  const teamInfo = await getTeamInfo(teamId);
  const fixturesData = getTeamFixtures(teamId);
  if (!teamInfo) return null;
  const { team, venue } = teamInfo;

  return (
    <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
      <TeamInfoWidget venue={venue} />
      <Suspense fallback={<SidebarItemSkeleton />}>
        <TeamFormWidgetSidebar
          teamId={team.id}
          fixtures={(await fixturesData) ?? []}
        />
      </Suspense>
      <TeamTrophiesWidget teamId={team.id} />
      <RecentNewsWidget />
      <AdSlotWidget location="match_sidebar" />
    </aside>
  );
}

// --- Main Page Component ---
export default async function TeamPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { locale, slug } = params;
  const teamId = getTeamIdFromSlug(slug[0]);
  if (!teamId) notFound();

  // Await only the most critical data for SEO and JSON-LD here.
  // The rest will be streamed in via Suspense.
  // MODIFIED: Fetch team info AND SEO content in parallel
  const [teamInfo, seoText] = await Promise.all([
    getTeamInfo(teamId),
    getSeoContent(teamId, locale),
  ]);

  const t = await getI18n(locale);
  const { team, venue } = teamInfo;
  // We need fixtures here for the country flag in the header.
  const fixtures = await getTeamFixtures(teamId);

  const pageUrl = `${BASE_URL}/${locale}/football/team/${slug[0]}`;
  const pageTitle = t("team_page_meta_title", { teamName: team.name });
  const pageDescription = t("team_page_meta_description", {
    teamName: team.name,
  });

  const jsonLd: WithContext<SportsTeam | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: team.name,
      alternateName: team.code,
      url: pageUrl,
      logo: team.logo,
      sport: "Soccer",
      foundingDate: team.founded?.toString(),
      location: {
        "@type": "Place",
        name: venue.city,
        address: {
          "@type": "PostalAddress",
          addressLocality: venue.city,
          addressCountry: team.country,
        },
      },
      coach: teamInfo.coach
        ? {
            "@type": "Person",
            name: teamInfo.coach.name,
          }
        : undefined,
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
          name: t("football_teams_title"),
          item: `${BASE_URL}/${locale}/football/teams`,
        },
        { "@type": "ListItem", position: 3, name: team.name },
      ],
    },
  ];

  return (
    <>
      <Script
        id="team-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />
          <div className="min-w-0 space-y-8">
            <TeamHeader
              team={team}
              countryFlag={teamInfo.team.country && fixtures?.[0]?.league?.flag}
              foundedText={t("founded_in", { year: team.founded })}
            />
            <MainContent teamId={teamId} locale={locale} seoText={seoText} />
          </div>
          <SidebarContent teamId={teamId} />
        </div>
      </div>
    </>
  );
}
