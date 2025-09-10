// ===== src/app/[locale]/football/team/[...slug]/page.tsx =====

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { WithContext, SportsTeam, BreadcrumbList } from "schema-dts";

import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import { getTeamInfo } from "@/lib/data/team";
import { getTeamPageData } from "@/lib/data/team";
import { generateTeamSlug } from "@/lib/generate-team-slug";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TeamDetailView from "@/components/TeamDetailView";
import TeamInfoWidget from "@/components/team/TeamInfoWidget";
import TeamTrophiesWidget from "@/components/team/TeamTrophiesWidget";
import TeamFormWidgetSidebar from "@/components/team/TeamFormWidgetSidebar";
import TeamSeoWidget from "@/components/team/TeamSeoWidget";
import AdSlotWidget from "@/components/AdSlotWidget";

const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

const getTeamIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  return /^\d+$/.test(lastPart) ? lastPart : null;
};

// Server-side function to generate metadata
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

  if (!teamId) {
    return { title: t("not_found_title"), alternates: hreflangAlternates };
  }

  // Fetch minimal data needed for metadata
  const teamInfo = await getTeamInfo(teamId);

  if (!teamInfo) {
    return {
      title: t("not_found_title"),
      alternates: hreflangAlternates,
      robots: { index: false, follow: false },
    };
  }

  const { team } = teamInfo;
  const pageTitle = t("team_page_meta_title", {
    teamName: team.name,
    country: team.country,
  });
  const pageDescription = t("team_page_meta_description", {
    teamName: team.name,
    country: team.country,
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
  };
}

// This is now a Server Component
export default async function TeamPage({
  params,
}: {
  params: { slug: string[]; locale: string };
}) {
  const { slug, locale } = params;
  const t = await getI18n(locale);
  const teamId = getTeamIdFromSlug(slug[0]);

  if (!teamId) {
    notFound();
  }

  // Fetch all data for the page on the server
  const teamData = await getTeamPageData(teamId);

  if (!teamData) {
    notFound();
  }

  const { teamInfo, fixtures } = teamData;
  const { team, venue } = teamInfo;

  // Prepare JSON-LD Schema data
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
      coach: team.coach?.name,
      athlete: team.squad?.map((p: any) => ({
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

  const seoWidgetTitle = t("about_team_title", { teamName: team.name });
  const seoWidgetText = t("team_page_seo_text", {
    teamName: team.name,
    country: team.country,
  });

  return (
    <>
      <Script
        id="team-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />

          <main className="min-w-0">
            <TeamDetailView teamData={teamData} />
          </main>

          <aside className="hidden lg:block lg:col-span-1 space-y-8 min-w-0">
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
