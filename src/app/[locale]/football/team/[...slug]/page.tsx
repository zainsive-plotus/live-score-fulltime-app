// ===== src/app/[locale]/football/team/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, SportsTeam, BreadcrumbList } from "schema-dts";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getTeamStaticData } from "@/lib/data/team-static";
import {
  getTeamFixtures,
  getTeamSquad,
  getTeamStandings,
} from "@/lib/data/team";
import { getTeamTransfers } from "@/lib/data/transfers";
import { getHighlightsForTeam } from "@/lib/data/highlightly";
import { generateTeamSlug } from "@/lib/generate-team-slug";

import Header from "@/components/Header";
import TeamDetailView from "@/components/TeamDetailView";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import TeamFormWidgetSidebar from "@/components/team/TeamFormWidgetSidebar";
import TeamSeoWidget from "@/components/team/TeamSeoWidget";
import AdSlotWidget from "@/components/AdSlotWidget";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const revalidate = 604800;

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

const parseTeamSlug = (slug: string): { id: string; name: string } | null => {
  if (!slug) return null;

  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];

  if (!/^\d+$/.test(lastPart)) {
    // If the last part is not a number, the slug is invalid.
    return null;
  }

  const id = lastPart;
  // Join all parts except for the last one (the ID) to get the name slug.
  const nameParts = parts.slice(0, -1);

  // Reconstruct a readable name from the slug parts.
  const name = nameParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { id, name };
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string[]; locale: string };
}): Promise<Metadata> {
  // --- ROBUSTNESS FIX ---
  if (!params.slug || !Array.isArray(params.slug) || params.slug.length === 0) {
    return {
      title: "Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { slug, locale } = params;
  const t = await getI18n(locale);

  // Use the new parsing function
  const teamInfoFromSlug = parseTeamSlug(slug[0]);

  // const hreflangAlternates = await generateHreflangTags(
  //   "/football/team",
  //   slug.join("/"),
  //   locale
  // );

  const path = `/football/team/${slug.join("/")}`;
  const canonicalUrl =
    locale === DEFAULT_LOCALE
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${locale}${path}`;

  if (!teamInfoFromSlug) {
    return {
      title: t("meta_not_found_title"),
      alternates: {
        canonical: canonicalUrl, // Still provide canonical for not-found pages
      },
    };
  }
  // --- OPTIMIZATION ---
  // We can now use the name directly from the slug for metadata,
  // avoiding a data fetch entirely.
  const pageTitle = t("team_page_meta_title", {
    teamName: teamInfoFromSlug.name,
  });
  const pageDescription = t("team_page_meta_description", {
    teamName: teamInfoFromSlug.name,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl, // Still provide canonical for not-found pages
    },
    // alternates: hreflangAlternates,
  };
}

export default async function TeamPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const teamId = getTeamIdFromSlug(slug[0]);
  const t = await getI18n(locale);

  if (!teamId) notFound();

  const teamInfo = await getTeamStaticData(teamId);
  if (!teamInfo) notFound();

  const { team, venue } = teamInfo;

  const [fixtures, squad, transfers, standings, highlights] = await Promise.all(
    [
      getTeamFixtures(teamId),
      getTeamSquad(teamId),
      getTeamTransfers(teamId),
      getTeamStandings(teamId),
      getHighlightsForTeam(team.name),
    ]
  );

  const teamData = {
    teamInfo,
    fixtures,
    squad,
    transfers,
    standings,
    highlights,
  };

  const seoWidgetTitle = t("about_team_title", { teamName: team.name });
  const seoWidgetText = t("team_page_seo_text", {
    teamName: team.name,
    country: team.country,
  });

  const jsonLd: WithContext<SportsTeam | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: team.name,
      sport: "Soccer",
      logo: team.logo,
      url: `${BASE_URL}${generateTeamSlug(team.name, team.id)}`,
      location: {
        "@type": "Place",
        name: venue.city,
        address: {
          "@type": "PostalAddress",
          addressLocality: venue.city,
          addressCountry: team.country,
        },
      },
      coach: squad?.[0]?.coach?.name,
      athlete: squad?.[0]?.players?.map((p: any) => ({
        "@type": "Person",
        name: p.name,
      })),
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
          name: t("teams"),
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start p-4 lg:py-6">
          <main className="min-w-0 space-y-8">
            <TeamDetailView teamData={teamData} />

            <div className="space-y-8 lg:hidden">
              <h2 className="font-bold text-xl text-white border-b-2 border-[var(--brand-accent)] pb-2">
                {t("team_overview")}
              </h2>
              <TeamInfoWidget venue={venue} />
              <TeamFormWidgetSidebar teamId={team.id} fixtures={fixtures} />
              <TeamTrophiesWidget teamId={team.id} />
              <AdSlotWidget location="homepage_right_sidebar" />
              <TeamSeoWidget title={seoWidgetTitle} seoText={seoWidgetText} />
            </div>
          </main>

          <aside className="hidden lg:block space-y-8 min-w-0">
            <TeamInfoWidget venue={venue} />
            <TeamFormWidgetSidebar teamId={team.id} fixtures={fixtures} />
            <TeamTrophiesWidget teamId={team.id} />
            <AdSlotWidget location="homepage_right_sidebar" />
            <TeamSeoWidget title={seoWidgetTitle} seoText={seoWidgetText} />
          </aside>
        </div>
      </div>
    </>
  );
}
