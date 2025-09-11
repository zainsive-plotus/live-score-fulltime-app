// src/app/[locale]/football/match/[...slug]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getFixture,
  getH2H,
  getStandings,
  getStatistics,
} from "@/lib/data/match";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Header from "@/components/Header";
import { MatchHeader } from "@/components/match/MatchHeader";
import TeamFormWidget from "@/components/match/TeamFormWidget";
import MatchH2HWidget from "@/components/match/MatchH2HWidget";
import MatchStatsWidget from "@/components/match/MatchStatsWidget";
import MatchActivityWidget from "@/components/match/MatchActivityWidget";
import SidebarContent from "./SidebarContent";
import {
  AdSlotWidgetSkeleton,
  RecentNewsWidgetSkeleton,
} from "@/components/skeletons/WidgetSkeletons";
import MatchFormationWidget from "@/components/match/MatchFormationWidget";
import StandingsWidget from "@/components/StandingsWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import MatchSeoWidget from "@/components/match/MatchSeoWidget";
import { generateLeagueSlug } from "@/lib/generate-league-slug";
import {
  BreadcrumbList,
  EventStatusType,
  Organization,
  SportsEvent,
  SportsTeam,
  WithContext,
} from "schema-dts";
import Script from "next/script";
import { RequestContext } from "@/lib/logging";
import { headers } from "next/headers";

// Revalidate pages every hour to catch updates (e.g., scores, stats)
export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

// // This function pre-builds pages for the next 3 days of matches.
// export async function generateStaticParams() {
//   try {
//     const fromDate = format(new Date(), "yyyy-MM-dd");
//     const toDate = format(addDays(new Date(), 2), "yyyy-MM-dd");

//     console.log(
//       `[generateStaticParams/Match] Fetching all matches from ${fromDate} to ${toDate}...`
//     );
//     const fixtures = await getFixturesByDateRange(fromDate, toDate);

//     if (!fixtures || fixtures.length === 0) {
//       console.warn(
//         "[generateStaticParams/Match] No upcoming fixtures found to pre-build."
//       );
//       return [];
//     }
//     console.log(
//       `[generateStaticParams/Match] Found ${fixtures.length} matches. Pre-hydrating cache...`
//     );

//     // Pre-hydrate the cache with full fixture data for each match.
//     // This prevents thousands of API calls during the page rendering step.
//     const pipeline = (redis as any).pipeline();
//     fixtures.forEach((fixture: any) => {
//       const cacheKey = `fixture:${fixture.fixture.id}`;
//       // Cache for 24 hours, long enough to outlast the build.
//       pipeline.set(cacheKey, JSON.stringify(fixture), "EX", 86400);
//     });
//     await pipeline.exec();
//     console.log(
//       `[generateStaticParams/Match] Redis cache pre-hydrated successfully.`
//     );

//     // Generate the slug parameters for Next.js
//     const params = fixtures.flatMap((fixture: any) =>
//       SUPPORTED_LOCALES.map((locale) => ({
//         locale,
//         slug: generateMatchSlug(
//           fixture.teams.home,
//           fixture.teams.away,
//           fixture.fixture.id
//         )
//           .replace(`/football/match/`, "")
//           .split("/"),
//       }))
//     );

//     console.log(
//       `[generateStaticParams/Match] Returning ${params.length} paths for Next.js to build.`
//     );
//     return params;
//   } catch (error: any) {
//     console.error(
//       "[generateStaticParams/Match] A critical error occurred:",
//       error.message
//     );
//     return [];
//   }
// }

const getFixtureIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug?.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// ... (generateMetadata function remains the same)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  const hreflangAlternates = await generateHreflangTags(
    "/football/match",
    slug.join("/"),
    locale
  );

  if (!fixtureId) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
    };
  }

  const headersList = headers();
  const metadataContext: RequestContext = {
    source: "server",
    pagePath: `/football/match/${slug[0]}`,
    callerName: "generateMetadata",
    ip: (await headersList).get("x-forwarded-for") ?? "unknown",
    userAgent: (await headersList).get("user-agent") ?? "unknown",
    geo: {
      // Vercel provides these headers automatically
      city: (await headersList).get("x-vercel-ip-city") ?? undefined,
      country: (await headersList).get("x-vercel-ip-country") ?? undefined,
      region:
        (await headersList).get("x-vercel-ip-country-region") ?? undefined,
    },
  };
  const fixtureData = await getFixture(fixtureId, metadataContext);

  if (!fixtureData) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { teams, league } = fixtureData;
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

const TeamFormContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
    <div className="bg-brand-secondary rounded-lg h-[400px] animate-pulse p-4"></div>
  </div>
);
const H2HContentSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-[450px] animate-pulse p-6"></div>
);
const FormationSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg p-4 md:p-6 animate-pulse h-[600px]"></div>
);
const StandingsWidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg h-96 animate-pulse p-6"></div>
);
const SidebarSkeleton = () => (
  <div className="space-y-6">
    <RecentNewsWidgetSkeleton />
    <div className="aspect-video w-full rounded-lg bg-gray-700/50 animate-pulse"></div>
    <div className="bg-brand-secondary rounded-lg h-80 animate-pulse"></div>
    <AdSlotWidgetSkeleton />
  </div>
);

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getI18n(locale);
  const fixtureId = getFixtureIdFromSlug(slug[0]);
  if (!fixtureId) notFound();

  const headersList = headers();
  const pageContext: RequestContext = {
    source: "server",
    pagePath: `/football/match/${slug[0]}`,
    callerName: "MatchDetailPage",
    ip: (await headersList).get("x-forwarded-for") ?? "unknown",
    userAgent: (await headersList).get("user-agent") ?? "unknown",
    geo: {
      city: (await headersList).get("x-vercel-ip-city") ?? undefined,
      country: (await headersList).get("x-vercel-ip-country") ?? undefined,
      region:
        (await headersList).get("x-vercel-ip-country-region") ?? undefined,
    },
  };

  const fixtureData = await getFixture(fixtureId, pageContext);
  if (!fixtureData) notFound();

  const { teams, fixture: fixtureDetails, league } = fixtureData;

  const [statistics, standingsResponse, h2h] = await Promise.all([
    getStatistics(fixtureId, pageContext),
    getStandings(league.id, league.season, pageContext),
    getH2H(teams.home.id, teams.away.idm, pageContext),
  ]);

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
    fixtureDetails?.status?.short
  );
  const isFinished = ["FT", "AET", "PEN"].includes(
    fixtureDetails?.status?.short
  );

  const aboutMatchTitle = t("about_the_match_title", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
  });
  const aboutMatchSeoText = t("match_page_about_seo_text", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });

  // --- NEW: Prepare all variables for the t() function ---
  const homeTopPlayer =
    fixtureData.lineups?.[0]?.startXI.sort(
      (a: any, b: any) =>
        parseFloat(b.player.rating || "0") - parseFloat(a.player.rating || "0")
    )[0]?.player.name || "Key Players";
  const awayTopPlayer =
    fixtureData.lineups?.[1]?.startXI.sort(
      (a: any, b: any) =>
        parseFloat(b.player.rating || "0") - parseFloat(a.player.rating || "0")
    )[0]?.player.name || "Key Players";
  const standings = standingsResponse?.[0]?.league?.standings?.[0] || [];
  const homeRank =
    standings.find((s: any) => s.team.id === teams.home.id)?.rank || "N/A";
  const awayRank =
    standings.find((s: any) => s.team.id === teams.away.id)?.rank || "N/A";

  const seoWidgetTitle = t("match_seo_widget_title", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    season: league.season,
  });

  const seoWidgetText = `
    <p>${t("match_seo_widget_intro", {
      leagueName: league.name,
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      matchDate: new Date(fixtureDetails.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      matchTime: new Date(fixtureDetails.date).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
      venueName: fixtureDetails.venue.name,
      venueCity: fixtureDetails.venue.city,
      season: league.season,
    })}</p>
    <p>${t("match_seo_widget_stakes", {
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      homeRank: homeRank,
      awayRank: awayRank,
    })}</p>
    <p>${t("match_seo_widget_search_terms", {
      homeTeam: teams.home.name,
      awayTeam: teams.away.name,
      leagueName: league.name,
      season: league.season,
    })}</p>
    <h3>${t("match_seo_widget_details_title")}</h3>
    <ul>
      <li>${t("match_seo_widget_details_name", {
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
      })}</li>
      <li>${t("match_seo_widget_details_date", {
        matchDate: new Date(fixtureDetails.date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      })}</li>
      <li>${t("match_seo_widget_details_time", {
        matchTime: new Date(fixtureDetails.date).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }),
      })}</li>
      <li>${t("match_seo_widget_details_venue", {
        venueName: fixtureDetails.venue.name,
        venueCity: fixtureDetails.venue.city,
      })}</li>
      <li>${t("match_seo_widget_details_competition", {
        leagueName: league.name,
        season: league.season,
      })}</li>
      <li>${t("match_seo_widget_details_standings", {
        homeTeam: teams.home.name,
        homeRank,
        awayTeam: teams.away.name,
        awayRank,
      })}</li>
    </ul>
    <h3>${t("match_seo_widget_features_title")}</h3>
    <ul>
      <li>${t("match_seo_widget_features_item1")}</li>
      <li>${t("match_seo_widget_features_item2", {
        homeTopPlayer,
        awayTopPlayer,
      })}</li>
      <li>${t("match_seo_widget_features_item3", {
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
        h2hCount: h2h?.length || 0,
      })}</li>
      <li>${t("match_seo_widget_features_item4", {
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
        leagueName: league.name,
        season: league.season,
      })}</li>
    </ul>
  `;

  const pageUrl = `${BASE_URL}/${locale}/football/match/${slug[0]}`;
  const pageDescription = t("match_page_description", {
    homeTeam: teams.home.name,
    awayTeam: teams.away.name,
    leagueName: league.name,
  });

  const statusMap: { [key: string]: EventStatusType } = {
    NS: "EventScheduled",
    TBD: "EventScheduled",
    PST: "EventPostponed",
    "1H": "EventInProgress",
    HT: "EventInProgress",
    "2H": "EventInProgress",
    ET: "EventInProgress",
    P: "EventInProgress",
    LIVE: "EventInProgress",
    FT: "EventCompleted",
    AET: "EventCompleted",
    PEN: "EventCompleted",
    CANC: "EventCancelled",
    ABD: "EventCancelled",
  };
  const schemaEventStatus =
    statusMap[fixtureDetails.status.short] || "EventScheduled";

  const fanSkorOrganization: Organization = {
    "@type": "Organization",
    name: "Fanskor",
    url: BASE_URL,
  };

  const homeTeamSchema: SportsTeam = {
    "@type": "SportsTeam",
    name: teams.home.name,
  };

  const awayTeamSchema: SportsTeam = {
    "@type": "SportsTeam",
    name: teams.away.name,
  };

  // NEW: Add broadcast and official website information
  const broadcastEvent = fixtureDetails.fixture?.tvstation
    ? {
        "@type": "BroadcastEvent",
        isLiveBroadcast: true,
        name: `Live stream on ${fixtureDetails.fixture.tvstation}`,
        broadcastOf: {
          "@type": "SportsEvent",
          name: `${teams.home.name} vs ${teams.away.name}`,
        },
      }
    : undefined;

  const jsonLd: WithContext<SportsEvent | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${teams.home.name} vs ${teams.away.name} - ${league.name}`,
      description: pageDescription,
      url: pageUrl,
      startDate: new Date(fixtureDetails.date).toISOString(),
      eventStatus: schemaEventStatus,
      sport: "Soccer", // Changed from "Football" to "Soccer" to match the example's precision
      location: {
        "@type": "StadiumOrArena",
        name: fixtureDetails.venue.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: fixtureDetails.venue.city,
          addressCountry: league.country,
        },
      },
      homeTeam: homeTeamSchema,
      awayTeam: awayTeamSchema,
      competitor: [homeTeamSchema, awayTeamSchema],
      organizer: fanSkorOrganization,
      potentialAction: broadcastEvent,
      superEvent: {
        "@type": "SportsEvent",
        name: league.name,
        url: `${BASE_URL}/${locale}${generateLeagueSlug(
          league.name,
          league.id
        )}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Soccer", // Generic top level, as in the example
          item: `${BASE_URL}/${locale}/football`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: league.name,
          item: `${BASE_URL}/${locale}${generateLeagueSlug(
            league.name,
            league.id
          )}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${teams.home.name} - ${teams.away.name}`, // Use a simple hyphen as per the example
          // The final item does not have an 'item' property
        },
      ],
    },
    // --- END OF NEW SECTION ---
  ];

  return (
    <>
      <Script
        id="match-details-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <title>
        {t("match_page_title", {
          homeTeam: teams.home.name,
          awayTeam: teams.away.name,
          leagueName: league.name,
        })}
      </title>
      <meta
        name="description"
        content={t("match_page_description", {
          homeTeam: teams.home.name,
          awayTeam: teams.away.name,
          leagueName: league.name,
        })}
      />

      <div
        className="bg-brand-dark min-h-screen"
        suppressHydrationWarning={true}
      >
        <Header />
        {/* CHANGE: Responsive grid layout */}
        <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8">
          {/* CHANGE: Left sidebar stacks below main on mobile, but appears first on desktop */}
          <aside className="lg:sticky lg:top-6 space-y-6 lg:order-1">
            <Suspense fallback={<StandingsWidgetSkeleton />}>
              <StandingsWidget
                leagueId={league.id}
                season={league.season}
                homeTeamId={teams.home.id}
                awayTeamId={teams.away.id}
                variant="compact"
              />
            </Suspense>
            <AdSlotWidget location="match_sidebar_left" />
          </aside>

          {/* CHANGE: Main content is always first on mobile */}
          <main className="space-y-6 min-w-0 order-first lg:order-2">
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

            <Suspense fallback={<H2HContentSkeleton />}>
              <MatchH2HWidget
                teams={teams}
                currentFixtureId={fixtureId}
                h2hSeoDescription={""}
              />
            </Suspense>

            {(isLive || isFinished) && (
              <MatchStatsWidget statistics={statistics || []} teams={teams} />
            )}

            <MatchActivityWidget
              fixtureId={fixtureId}
              isLive={isLive}
              homeTeamId={teams.home.id}
            />

            <MatchSeoWidget title={seoWidgetTitle} seoText={seoWidgetText} />
          </main>

          {/* CHANGE: Right sidebar stacks last on mobile, but appears third on desktop */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:order-3">
            <Suspense fallback={<SidebarSkeleton />}>
              <SidebarContent
                fixtureData={fixtureData}
                isLive={isLive}
                aboutMatchTitle={aboutMatchTitle}
                aboutMatchSeoText={aboutMatchSeoText}
              />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  );
}
